import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import {
  hashPassword,
  verifyPasswordNoPepper,
  verifyPasswordWithPepper,
  isBcryptHash,
  needsRehash,
} from "@/lib/passwords"
import { Validator } from "@/lib/validation"
import { createAuthSessionAndCookies } from "@/lib/refresh"


const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>()

function checkRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

function checkAccountLock(email: string): { locked: boolean; remainingTime?: number } {
  const record = loginAttempts.get(email)
  if (!record) return { locked: false }

  const now = Date.now()
  if (record.lockedUntil > now) {
    const remainingTime = Math.ceil((record.lockedUntil - now) / 60000)
    return { locked: true, remainingTime }
  }

  return { locked: false }
}

function recordFailedAttempt(email: string): void {
  const record = loginAttempts.get(email) || { count: 0, lockedUntil: 0 }
  record.count++

  if (record.count >= 5) {
    record.lockedUntil = Date.now() + 1 * 60 * 1000 // Lock for 1 minute
    console.log(`[SECURITY] Account locked: ${email}`)
  }

  loginAttempts.set(email, record)
}

function resetLoginAttempts(email: string): void {
  loginAttempts.delete(email)
}



export async function POST(request: NextRequest) {
  try {
   
    const clientIp = request.headers.get("x-forwarded-for") || "unknown"
    if (!checkRateLimit(`login_${clientIp}`, 5, 60000)) {
      return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 })
    }

  
    const body = await request.json()
    const { email, password } = body

    
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    
    const sanitizedEmail = Validator.sanitizeInput(String(email).toLowerCase().trim())
    const emailCheck = Validator.validateEmail(sanitizedEmail)
    if (!emailCheck.isValid) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }
    
    const passwordCheck = Validator.validatePassword(String(password))
    if (!passwordCheck.isValid) {
      return NextResponse.json({ error: passwordCheck.error || "Invalid password" }, { status: 400 })
    }

   
    const lockStatus = checkAccountLock(sanitizedEmail)
    if (lockStatus.locked) {
      return NextResponse.json(
        {
          error: `Account temporarily locked. Please try again in ${lockStatus.remainingTime} minutes.`,
        },
        { status: 403 },
      )
    }

    
    const db = await getDb()
    const seedUsers = [
      { id: "1", email: "john@bank.com", password: "SecurePass123!", name: "John Smith", role: "customer" },
      { id: "2", email: "admin@bank.com", password: "AdminPass123!", name: "Admin User", role: "admin" },
    ] as const

    const hashedSeedUsers = await Promise.all(
      seedUsers.map(async (u) => ({ ...u, password: await hashPassword(u.password) }))
    )

    await db.collection("users").bulkWrite(
      hashedSeedUsers.map((u) => ({
        updateOne: {
          filter: { email: u.email },
          update: {
            $setOnInsert: {
              id: u.id,
              email: u.email,
              password: u.password,
              name: u.name,
              role: u.role,
              createdAt: new Date(),
            },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    )
    await db.collection("users").createIndex({ email: 1 }, { unique: true })

    
    const userRecord = await db.collection("users").findOne<{
      id: string
      email: string
      name: string
      role: string
      password: string
      twoFactorEnabled?: boolean
    }>(
      { email: sanitizedEmail },
      { projection: { _id: 0, id: 1, email: 1, name: 1, role: 1, password: 1, twoFactorEnabled: 1 } },
    )

    let passwordValid = false
    if (userRecord) {
      const stored = userRecord.password
      if (isBcryptHash(stored)) {
        
        if (await verifyPasswordNoPepper(password, stored)) {
          passwordValid = true
          
          if (needsRehash(stored)) {
            const newHash = await hashPassword(password)
            await db.collection("users").updateOne({ email: userRecord.email }, { $set: { password: newHash } })
          }
        } else if (await verifyPasswordWithPepper(password, stored)) {
          
          passwordValid = true
          const newHash = await hashPassword(password)
          await db.collection("users").updateOne({ email: userRecord.email }, { $set: { password: newHash } })
        }
      } else if (typeof stored === "string") {
        
        if (stored === password) {
          const newHash = await hashPassword(password)
          await db.collection("users").updateOne({ email: userRecord.email }, { $set: { password: newHash } })
          passwordValid = true
        } else {
          passwordValid = false
        }
      }
    }

    if (!userRecord || !passwordValid) {
      recordFailedAttempt(sanitizedEmail)
      console.log(`[SECURITY] Failed login attempt: ${sanitizedEmail}`)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    
    resetLoginAttempts(sanitizedEmail)
    await db.collection("users").updateOne({ email: userRecord.email }, { $set: { lastLogin: new Date() } })

   

    const requiresTwoFactor = Boolean(userRecord.twoFactorEnabled)

    
    if (requiresTwoFactor) {
      return NextResponse.json({
        success: true,
        user: {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name,
          role: userRecord.role,
          twoFactorEnabled: requiresTwoFactor,
        },
        requiresTwoFactor,
        pendingUserId: userRecord.id,
      })
    }

    
    const res = NextResponse.json({
      success: true,
      user: {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        role: userRecord.role,
        twoFactorEnabled: requiresTwoFactor,
      },
      requiresTwoFactor,
    })
    const userAgent = request.headers.get("user-agent") || undefined
    const ip = request.headers.get("x-forwarded-for") || undefined
    await createAuthSessionAndCookies({
      user: { id: userRecord.id, email: userRecord.email, role: userRecord.role },
      res,
      userAgent,
      ip,
    })
    return res
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

import { type NextRequest, NextResponse } from "next/server"

// Mock rate limiting store
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
    record.lockedUntil = Date.now() + 15 * 60 * 1000 // Lock for 15 minutes
    console.log(`[SECURITY] Account locked: ${email}`)
  }

  loginAttempts.set(email, record)
}

function resetLoginAttempts(email: string): void {
  loginAttempts.delete(email)
}

function validateEmail(email: string): boolean {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailPattern.test(email)
}

function sanitizeInput(input: string): string {
  return input.replace(/[<>"'&]/g, (char) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "&": "&amp;",
    }
    return entities[char] || char
  })
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limiting
    const clientIp = request.headers.get("x-forwarded-for") || "unknown"
    if (!checkRateLimit(`login_${clientIp}`, 5, 60000)) {
      return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 })
    }

    // Parse request body
    const body = await request.json()
    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Sanitize email
    const sanitizedEmail = sanitizeInput(email.toLowerCase().trim())

    // Validate email format
    if (!validateEmail(sanitizedEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Check if account is locked
    const lockStatus = checkAccountLock(sanitizedEmail)
    if (lockStatus.locked) {
      return NextResponse.json(
        {
          error: `Account temporarily locked. Please try again in ${lockStatus.remainingTime} minutes.`,
        },
        { status: 403 },
      )
    }

    // Demo users (in production, check against hashed passwords in database)
    const demoUsers = [
      { id: "1", email: "john@bank.com", password: "SecurePass123!", name: "John Smith", role: "customer" },
      { id: "2", email: "admin@bank.com", password: "AdminPass123!", name: "Admin User", role: "admin" },
    ]

    const user = demoUsers.find((u) => u.email === sanitizedEmail && u.password === password)

    if (!user) {
      recordFailedAttempt(sanitizedEmail)
      console.log(`[SECURITY] Failed login attempt: ${sanitizedEmail}`)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Reset failed attempts on successful login
    resetLoginAttempts(sanitizedEmail)

    // In production:
    // 1. Generate JWT token
    // 2. Create session in database
    // 3. Set secure, httpOnly cookies
    // 4. Log security event

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      requiresTwoFactor: true,
    })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

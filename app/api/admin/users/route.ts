import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { Validator } from "@/lib/validation"
import { hashPassword } from "@/lib/passwords"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body || {}

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 })
    }

    const emailCheck = Validator.validateEmail(String(email))
    if (!emailCheck.isValid) {
      return NextResponse.json({ error: emailCheck.error || "Invalid email" }, { status: 400 })
    }

    const passwordCheck = Validator.validatePassword(String(password))
    if (!passwordCheck.isValid) {
      return NextResponse.json({ error: passwordCheck.error || "Invalid password" }, { status: 400 })
    }

    const nameCheck = Validator.validateName(String(name))
    if (!nameCheck.isValid) {
      return NextResponse.json({ error: nameCheck.error || "Invalid name" }, { status: 400 })
    }

    const db = await getDb()

    await db.collection("users").createIndex({ email: 1 }, { unique: true })

    const existing = await db.collection("users").findOne({ email: String(email).toLowerCase().trim() })
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    const now = new Date()
    const id = String(Date.now())
    const hashed = await hashPassword(String(password))
    const userDoc = {
      id,
      email: String(email).toLowerCase().trim(),
      password: hashed,
      name: String(name),
      role: "admin" as const,
      createdAt: now,
      lastLogin: null as Date | null,
    }

    await db.collection("users").insertOne(userDoc)

    return NextResponse.json({
      success: true,
      user: {
        id: userDoc.id,
        email: userDoc.email,
        name: userDoc.name,
        role: userDoc.role,
        createdAt: userDoc.createdAt,
        lastLogin: userDoc.lastLogin,
      },
    })
  } catch (error) {
    console.error("[API ERROR] create admin", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

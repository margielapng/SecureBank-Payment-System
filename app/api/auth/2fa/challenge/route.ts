import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import speakeasy from "speakeasy"
import { decrypt } from "@/lib/crypto"
import { Validator } from "@/lib/validation"
import { createAuthSessionAndCookies } from "@/lib/refresh"

export async function POST(req: Request) {
  try {
    const { pendingUserId, code } = await req.json()

    if (!pendingUserId || !code) {
      return NextResponse.json({ error: "pendingUserId and code are required" }, { status: 400 })
    }

    const db = await getDb()
    const sanitizedId = Validator.sanitizeInput(String(pendingUserId))
    const user = await db.collection("users").findOne<any>({ id: sanitizedId })
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecretEncrypted) {
      return NextResponse.json({ error: "2FA not enabled for user" }, { status: 400 })
    }

    const secret = decrypt(user.twoFactorSecretEncrypted)
    const codeStr = String(code)
    const codeValidation = Validator.validate2FACode(codeStr)
    if (!codeValidation.isValid) {
      return NextResponse.json({ success: false, error: codeValidation.error }, { status: 400 })
    }
    const ok = speakeasy.totp.verify({ secret, encoding: "base32", token: codeStr, window: 1 })

    if (!ok) {
      return NextResponse.json({ success: false, error: "Invalid verification code" }, { status: 400 })
    }

    // Issue access and refresh tokens and set httpOnly cookies
    const res = NextResponse.json({ success: true })
    const userAgent = req.headers.get("user-agent") || undefined
    const ip = req.headers.get("x-forwarded-for") || undefined
    await createAuthSessionAndCookies({
      user: { id: user.id, email: user.email, role: user.role },
      res,
      userAgent,
      ip,
    })
    return res
  } catch (e) {
    console.error("[2FA challenge]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

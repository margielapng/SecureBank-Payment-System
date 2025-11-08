import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import speakeasy from "speakeasy"
import QRCode from "qrcode"
import { encrypt } from "@/lib/crypto"
import { Validator } from "@/lib/validation"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { userId } = body || {}

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const db = await getDb()
    const sanitizedId = Validator.sanitizeInput(String(userId))
    const user = await db.collection("users").findOne({ id: sanitizedId })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const secret = speakeasy.generateSecret({
      name: `SecureBank (${user.email})`,
      length: 20,
    })

    const encrypted = encrypt(secret.base32)
    await db
      .collection("users")
      .updateOne(
        { id: user.id },
        { $set: { twoFactorSecretEncrypted: encrypted }, $setOnInsert: { twoFactorEnabled: false } },
        { upsert: false }
      )

    const otpauthUrl = secret.otpauth_url || `otpauth://totp/SecureBank:${encodeURIComponent(user.email)}?secret=${secret.base32}&issuer=SecureBank`
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl)

    return NextResponse.json({ success: true, qrDataUrl, otpauthUrl, base32: secret.base32 })
  } catch (e) {
    console.error("[2FA setup]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

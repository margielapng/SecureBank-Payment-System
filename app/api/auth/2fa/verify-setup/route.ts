import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import speakeasy from "speakeasy"
import { decrypt } from "@/lib/crypto"

export async function POST(req: Request) {
  try {
    const { userId, code } = await req.json()

    if (!userId || !code) {
      return NextResponse.json({ error: "userId and code are required" }, { status: 400 })
    }

    const db = await getDb()
    const user = await db.collection("users").findOne<any>({ id: String(userId) })
    if (!user || !user.twoFactorSecretEncrypted) {
      return NextResponse.json({ error: "2FA not initialized" }, { status: 400 })
    }

    const secret = decrypt(user.twoFactorSecretEncrypted)

    const ok = speakeasy.totp.verify({ secret, encoding: "base32", token: String(code), window: 1 })
    if (!ok) {
      return NextResponse.json({ success: false, error: "Invalid code" }, { status: 400 })
    }

    await db.collection("users").updateOne({ id: user.id }, { $set: { twoFactorEnabled: true } })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[2FA verify-setup]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

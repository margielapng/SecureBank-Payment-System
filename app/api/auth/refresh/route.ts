import { NextResponse } from "next/server"
import { findActiveRefreshToken, revokeRefreshTokenById, generateRawRefreshToken, issueRefreshCookie, persistRefreshToken } from "@/lib/refresh"
import { signToken } from "@/lib/jwt"
import { getDb } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const cookieHeader = (req as any).headers?.get("cookie") || ""
    const refreshCookie = cookieHeader
      .split(";")
      .map((c: string) => c.trim())
      .find((c: string) => c.startsWith("refresh_token="))

    const rawToken = refreshCookie?.split("=")[1]

    if (!rawToken) {
      return NextResponse.json({ error: "Missing refresh token" }, { status: 401 })
    }

    const existing = await findActiveRefreshToken(rawToken)
    if (!existing) {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 })
    }

    // Rotate: create a new token, then revoke the current one
    const res = NextResponse.json({ success: true })

    const userAgent = req.headers.get("user-agent") || undefined
    const ip = req.headers.get("x-forwarded-for") || undefined

    const newRaw = generateRawRefreshToken()
    const created = await persistRefreshToken({
      userId: existing.userId,
      sessionId: existing.sessionId,
      rawToken: newRaw,
      userAgent,
      ip,
    })
    await revokeRefreshTokenById(existing.tokenId, created.tokenId)
    await issueRefreshCookie(res, newRaw)

    // Issue new access token (lookup email/role)
    const db = await getDb()
    const user = await db.collection("users").findOne<{ id: string; email: string; role: string }>(
      { id: existing.userId },
      { projection: { _id: 0, id: 1, email: 1, role: 1 } } as any,
    )
    const jwt = await signToken({ sub: existing.userId, email: user?.email || "", role: (user?.role as any) || "customer" })
    res.cookies.set("auth_token", jwt, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 30,
    })

    return res
  } catch (e) {
    console.error("[AUTH REFRESH]", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

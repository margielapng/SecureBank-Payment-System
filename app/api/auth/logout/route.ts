import { NextResponse } from "next/server"
import { revokeRefreshTokenById, findActiveRefreshToken } from "@/lib/refresh"

export async function POST(req: Request) {
  const res = NextResponse.json({ success: true })

  try {
    const cookieHeader = (req as any).headers?.get("cookie") || ""
    const rtCookie = cookieHeader
      .split(";")
      .map((c: string) => c.trim())
      .find((c: string) => c.startsWith("refresh_token="))

    const rawRt = rtCookie?.split("=")[1]
    if (rawRt) {
      const existing = await findActiveRefreshToken(rawRt)
      if (existing) {
        await revokeRefreshTokenById(existing.tokenId)
      }
    }
  } catch (e) {
    console.error("[AUTH LOGOUT]", e)
  }

  res.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  })
  res.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  })

  return res
}

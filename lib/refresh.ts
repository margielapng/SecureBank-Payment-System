import crypto from "crypto"
import { getDb } from "@/lib/db"
import { signToken } from "@/lib/jwt"

const RT_SECRET = process.env.REFRESH_TOKEN_SECRET
const RT_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30)

if (!RT_SECRET) {
  throw new Error("REFRESH_TOKEN_SECRET is not set. Add it to your .env.local file.")
}

export interface RefreshTokenDoc {
  tokenId: string
  userId: string
  sessionId: string
  tokenHash: string
  createdAt: Date
  expiresAt: Date
  revokedAt?: Date | null
  replacedByTokenId?: string | null
  userAgent?: string
  ip?: string
}

function hmac(input: string): string {
  return crypto.createHmac("sha256", RT_SECRET as string).update(input).digest("hex")
}

function randomId(bytes = 16): string {
  return crypto.randomBytes(bytes).toString("hex")
}

export function generateRawRefreshToken(): string {
  
  return crypto.randomBytes(64).toString("base64url")
}

export async function persistRefreshToken(params: {
  userId: string
  sessionId: string
  rawToken: string
  userAgent?: string
  ip?: string
}): Promise<RefreshTokenDoc> {
  const db = await getDb()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + RT_TTL_DAYS * 24 * 60 * 60 * 1000)
  const tokenId = randomId(16)
  const doc: RefreshTokenDoc = {
    tokenId,
    userId: params.userId,
    sessionId: params.sessionId,
    tokenHash: hmac(params.rawToken),
    createdAt: now,
    expiresAt,
    revokedAt: null,
    replacedByTokenId: null,
    userAgent: params.userAgent,
    ip: params.ip,
  }
  await db.collection<RefreshTokenDoc>("refresh_tokens").insertOne(doc as any)
  await db.collection("refresh_tokens").createIndex({ tokenId: 1 }, { unique: true })
  await db.collection("refresh_tokens").createIndex({ userId: 1 })
  await db.collection("refresh_tokens").createIndex({ sessionId: 1 })
  await db.collection("refresh_tokens").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
  return doc
}

export async function findActiveRefreshToken(rawToken: string): Promise<RefreshTokenDoc | null> {
  const db = await getDb()
  const now = new Date()
  const token = await db.collection<RefreshTokenDoc>("refresh_tokens").findOne({
    tokenHash: hmac(rawToken),
    revokedAt: { $in: [null, undefined] },
    expiresAt: { $gt: now },
  } as any)
  return token || null
}

export async function revokeRefreshTokenById(tokenId: string, replacedByTokenId?: string) {
  const db = await getDb()
  await db.collection("refresh_tokens").updateOne(
    { tokenId },
    { $set: { revokedAt: new Date(), replacedByTokenId: replacedByTokenId || null } },
  )
}

export async function issueRefreshCookie(res: import("next/server").NextResponse, rawToken: string) {
  const maxAge = RT_TTL_DAYS * 24 * 60 * 60
  res.cookies.set("refresh_token", rawToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge,
  })
}

export async function createAuthSessionAndCookies(params: {
  user: { id: string; email: string; role: string }
  res: import("next/server").NextResponse
  sessionId?: string
  userAgent?: string
  ip?: string
}) {
  const { user, res } = params
  const sessionId = params.sessionId || randomId(16)

 
  const jwt = await signToken({ sub: user.id, email: user.email, role: user.role })
  res.cookies.set("auth_token", jwt, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 30,
  })

 
  const rawRt = generateRawRefreshToken()
  await persistRefreshToken({
    userId: user.id,
    sessionId,
    rawToken: rawRt,
    userAgent: params.userAgent,
    ip: params.ip,
  })
  await issueRefreshCookie(res, rawRt)

  return { sessionId }
}

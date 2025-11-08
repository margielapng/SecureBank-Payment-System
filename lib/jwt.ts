import { SignJWT, jwtVerify } from "jose"

const DEFAULT_ISSUER = "securebank"
const DEFAULT_AUDIENCE = "securebank-users"
const DEFAULT_EXPIRES = "30m"

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "dev-insecure-secret-change"
  return new TextEncoder().encode(secret)
}

export interface JwtPayload {
  sub: string
  email: string
  role: string
}

export async function signToken(payload: JwtPayload): Promise<string> {
  const secret = getSecret()
  const jwt = await new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer(process.env.JWT_ISSUER || DEFAULT_ISSUER)
    .setAudience(process.env.JWT_AUDIENCE || DEFAULT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES)
    .sign(secret)
  return jwt
}

export async function verifyToken(token: string) {
  const secret = getSecret()
  const { payload } = await jwtVerify(token, secret, {
    issuer: process.env.JWT_ISSUER || DEFAULT_ISSUER,
    audience: process.env.JWT_AUDIENCE || DEFAULT_AUDIENCE,
  })
  return payload
}

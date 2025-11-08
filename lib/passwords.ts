import * as bcrypt from "bcryptjs"

const ROUNDS = Number(process.env.BCRYPT_COST || 12)
const PEPPER = process.env.PASSWORD_PEPPER || ""

function withPepper(password: string): string {
  return PEPPER ? `${password}${PEPPER}` : password
}

export function isBcryptHash(value: unknown): boolean {
  if (typeof value !== "string") return false

  return /^\$2[aby]\$\d{2}\$[A-Za-z0-9./]{53}$/.test(value)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(ROUNDS)
  
  return bcrypt.hash(password, salt)
}


export async function verifyPasswordNoPepper(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch {
    return false
  }
}


export async function verifyPasswordWithPepper(password: string, hash: string): Promise<boolean> {
  try {
    if (!PEPPER) return false
    return await bcrypt.compare(withPepper(password), hash)
  } catch {
    return false
  }
}

export function needsRehash(hash: string): boolean {
  if (!isBcryptHash(hash)) return true
  
  const parts = hash.split("$")
  
  const costStr = parts[2]
  const cost = Number(costStr)
  if (!Number.isFinite(cost)) return true
  return cost !== ROUNDS
}

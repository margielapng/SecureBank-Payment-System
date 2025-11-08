// Client-side encryption utilities for sensitive data

export class EncryptionManager {
  // Simple hash function for client-side (SHA-256)
  static async hash(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  // Generate encryption key from password
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password)

    const importedKey = await crypto.subtle.importKey("raw", passwordBuffer, { name: "PBKDF2" }, false, [
      "deriveBits",
      "deriveKey",
    ])

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      importedKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    )
  }

  // Encrypt data using AES-256-GCM
  static async encrypt(data: string, password: string): Promise<string> {
    try {
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)

      // Generate salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const iv = crypto.getRandomValues(new Uint8Array(12))

      // Derive key
      const key = await this.deriveKey(password, salt)

      // Encrypt
      const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, dataBuffer)

      // Combine salt + iv + encrypted data
      const result = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength)
      result.set(salt, 0)
      result.set(iv, salt.length)
      result.set(new Uint8Array(encryptedBuffer), salt.length + iv.length)

      // Convert to base64
      return btoa(String.fromCharCode(...result))
    } catch (error) {
      throw new Error("Encryption failed")
    }
  }

  // Decrypt data
  static async decrypt(encryptedData: string, password: string): Promise<string> {
    try {
      // Convert from base64
      const data = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0))

      // Extract salt, IV, and encrypted data
      const salt = data.slice(0, 16)
      const iv = data.slice(16, 28)
      const encrypted = data.slice(28)

      // Derive key
      const key = await this.deriveKey(password, salt)

      // Decrypt
      const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted)

      // Convert to string
      const decoder = new TextDecoder()
      return decoder.decode(decryptedBuffer)
    } catch (error) {
      throw new Error("Decryption failed")
    }
  }

  // Mask sensitive data for display (e.g., credit card, account number)
  static maskData(data: string, visibleChars = 4): string {
    if (data.length <= visibleChars) return data
    const masked = "*".repeat(data.length - visibleChars)
    return masked + data.slice(-visibleChars)
  }
}

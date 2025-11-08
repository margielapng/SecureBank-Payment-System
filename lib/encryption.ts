

export class EncryptionManager {
 
  static async hash(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }


  private static async deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
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

  
  static async encrypt(data: string, password: string): Promise<string> {
    try {
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)

    
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const iv = crypto.getRandomValues(new Uint8Array(12))

      
      const key = await this.deriveKey(password, salt.buffer)

      
      const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, dataBuffer)

     
      const result = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength)
      result.set(salt, 0)
      result.set(iv, salt.length)
      result.set(new Uint8Array(encryptedBuffer), salt.length + iv.length)

      
      return btoa(String.fromCharCode(...result))
    } catch (error) {
      throw new Error("Encryption failed")
    }
  }

  
  static async decrypt(encryptedData: string, password: string): Promise<string> {
    try {
     
      const data = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0))

      
      const salt = data.slice(0, 16)
      const iv = data.slice(16, 28)
      const encrypted = data.slice(28)

      
      const key = await this.deriveKey(password, salt.buffer)

     
      const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted)

     
      const decoder = new TextDecoder()
      return decoder.decode(decryptedBuffer)
    } catch (error) {
      throw new Error("Decryption failed")
    }
  }

  
  static maskData(data: string, visibleChars = 4): string {
    if (data.length <= visibleChars) return data
    const masked = "*".repeat(data.length - visibleChars)
    return masked + data.slice(-visibleChars)
  }
}

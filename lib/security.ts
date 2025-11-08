

export interface SecurityEvent {
  type: "login" | "logout" | "failed_login" | "transaction" | "admin_action" | "suspicious_activity"
  userId?: string
  email?: string
  ipAddress?: string
  details: string
  severity: "low" | "medium" | "high" | "critical"
  timestamp: string
}

export interface Session {
  id: string
  userId: string
  email: string
  createdAt: number
  lastActivity: number
  expiresAt: number
}

export interface RateLimitEntry {
  count: number
  resetAt: number
}

export class SecurityManager {
  private static readonly SESSION_DURATION = 30 * 60 * 1000 // 30 minutes
  private static readonly MAX_LOGIN_ATTEMPTS = 5
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

  // CSRF Token Management
  static generateCSRFToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
  }

  static storeCSRFToken(token: string): void {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("csrf_token", token)
    }
  }

  static getCSRFToken(): string | null {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("csrf_token")
    }
    return null
  }

  static validateCSRFToken(token: string): boolean {
    const storedToken = this.getCSRFToken()
    return storedToken === token
  }

  
  static createSession(userId: string, email: string): Session {
    const now = Date.now()
    const session: Session = {
      id: this.generateSessionId(),
      userId,
      email,
      createdAt: now,
      lastActivity: now,
      expiresAt: now + this.SESSION_DURATION,
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("session", JSON.stringify(session))
      this.logSecurityEvent({
        type: "login",
        userId,
        email,
        details: "User logged in successfully",
        severity: "low",
        timestamp: new Date().toISOString(),
      })
    }

    return session
  }

  static getSession(): Session | null {
    if (typeof window === "undefined") return null

    const sessionStr = localStorage.getItem("session")
    if (!sessionStr) return null

    try {
      const session: Session = JSON.parse(sessionStr)

      
      if (Date.now() > session.expiresAt) {
        this.destroySession()
        return null
      }

      return session
    } catch {
      return null
    }
  }

  static validateSession(): boolean {
    const session = this.getSession()
    if (!session) return false

    
    session.lastActivity = Date.now()
    if (typeof window !== "undefined") {
      localStorage.setItem("session", JSON.stringify(session))
    }

    return true
  }

  static destroySession(): void {
    if (typeof window !== "undefined") {
      const session = this.getSession()
      if (session) {
        this.logSecurityEvent({
          type: "logout",
          userId: session.userId,
          email: session.email,
          details: "User logged out",
          severity: "low",
          timestamp: new Date().toISOString(),
        })
      }
      localStorage.removeItem("session")
      sessionStorage.removeItem("csrf_token")
    }
  }

  private static generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Rate Limiting
  static checkRateLimit(identifier: string, maxRequests = 5, windowMs = 60000): boolean {
    if (typeof window === "undefined") return true

    const key = `rate_limit_${identifier}`
    const now = Date.now()
    const dataStr = localStorage.getItem(key)

    let entry: RateLimitEntry

    if (dataStr) {
      entry = JSON.parse(dataStr)

      
      if (now > entry.resetAt) {
        entry = { count: 1, resetAt: now + windowMs }
      } else {
        entry.count++
      }
    } else {
      entry = { count: 1, resetAt: now + windowMs }
    }

    localStorage.setItem(key, JSON.stringify(entry))

    if (entry.count > maxRequests) {
      this.logSecurityEvent({
        type: "suspicious_activity",
        details: `Rate limit exceeded for ${identifier}`,
        severity: "high",
        timestamp: new Date().toISOString(),
      })
      return false
    }

    return true
  }

  // Brute Force Protection
  static recordLoginAttempt(email: string, success: boolean): boolean {
    if (typeof window === "undefined") return true

    const key = `login_attempts_${email}`
    const now = Date.now()
    const dataStr = localStorage.getItem(key)

    interface LoginAttempts {
      count: number
      lockedUntil?: number
    }

    let attempts: LoginAttempts

    if (dataStr) {
      attempts = JSON.parse(dataStr)

      // Check if account is locked, acc gets locked due to too many tries
      if (attempts.lockedUntil && now < attempts.lockedUntil) {
        const remainingMs = attempts.lockedUntil - now
        const remainingMin = Math.ceil(remainingMs / 60000)
        this.logSecurityEvent({
          type: "failed_login",
          email,
          details: `Account locked. ${remainingMin} minutes remaining`,
          severity: "high",
          timestamp: new Date().toISOString(),
        })
        return false
      }

      
      if (attempts.lockedUntil && now >= attempts.lockedUntil) {
        attempts = { count: 0 }
      }
    } else {
      attempts = { count: 0 }
    }

    if (success) {
      // Clear attempts on successful loginsa
      localStorage.removeItem(key)
      return true
    } else {
      // Increment failed attempts
      attempts.count++

      if (attempts.count >= this.MAX_LOGIN_ATTEMPTS) {
        attempts.lockedUntil = now + this.LOCKOUT_DURATION
        this.logSecurityEvent({
          type: "failed_login",
          email,
          details: `Account locked after ${this.MAX_LOGIN_ATTEMPTS} failed attempts`,
          severity: "critical",
          timestamp: new Date().toISOString(),
        })
      } else {
        this.logSecurityEvent({
          type: "failed_login",
          email,
          details: `Failed login attempt ${attempts.count}/${this.MAX_LOGIN_ATTEMPTS}`,
          severity: "medium",
          timestamp: new Date().toISOString(),
        })
      }

      localStorage.setItem(key, JSON.stringify(attempts))
      return attempts.count < this.MAX_LOGIN_ATTEMPTS
    }
  }

 
  static logSecurityEvent(event: SecurityEvent): void {
    if (typeof window === "undefined") return

    // Store last 100 events for audit logginf for admins
    const key = "security_logs"
    const logsStr = localStorage.getItem(key)
    let logs: SecurityEvent[] = logsStr ? JSON.parse(logsStr) : []

    logs.unshift(event)
    if (logs.length > 100) logs = logs.slice(0, 100)

    localStorage.setItem(key, JSON.stringify(logs))
  }

  static getSecurityLogs(): SecurityEvent[] {
    if (typeof window === "undefined") return []

    const logsStr = localStorage.getItem("security_logs")
    return logsStr ? JSON.parse(logsStr) : []
  }

  // Suspicious Activity Detection
  static detectSuspiciousActivity(data: {
    amount?: number
    transactionCount?: number
    countries?: string[]
    ipChanges?: number
  }): { isSuspicious: boolean; reasons: string[] } {
    const reasons: string[] = []

    if (data.amount && data.amount >= 50000) {
      reasons.push("High-value transaction (≥$50,000)")
    }

    if (data.transactionCount && data.transactionCount > 10) {
      reasons.push("Excessive transaction frequency (>10/day)")
    }

    if (data.countries && data.countries.length > 3) {
      reasons.push("Multiple countries involved (>3)")
    }

    if (data.ipChanges && data.ipChanges > 5) {
      reasons.push("Frequent IP address changes (>5/session)")
    }

    if (reasons.length > 0) {
      this.logSecurityEvent({
        type: "suspicious_activity",
        details: reasons.join(", "),
        severity: "high",
        timestamp: new Date().toISOString(),
      })
    }

    return {
      isSuspicious: reasons.length > 0,
      reasons,
    }
  }

  // Generate secure random password
  static generateSecurePassword(length = 16): string {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const lowercase = "abcdefghijklmnopqrstuvwxyz"
    const numbers = "0123456789"
    const special = "@$!%*?&"
    const all = uppercase + lowercase + numbers + special

    let password = ""
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += special[Math.floor(Math.random() * special.length)]

    for (let i = 4; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)]
    }

    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("")
  }
}

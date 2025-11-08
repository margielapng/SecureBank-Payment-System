"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { SecurityManager } from "./security"
import { Validator } from "./validation"

interface User {
  id: string
  email: string
  name: string
  role: "customer" | "admin"
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  needsTwoFactor: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  verify2FA: (code: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo users for testing
const DEMO_USERS = [
  { id: "1", email: "john@bank.com", password: "SecurePass123!", name: "John Smith", role: "customer" as const },
  { id: "2", email: "admin@bank.com", password: "AdminPass123!", name: "Admin User", role: "admin" as const },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false)
  const [pendingUser, setPendingUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const session = SecurityManager.getSession()
    if (session) {
      const demoUser = DEMO_USERS.find((u) => u.email === session.email)
      if (demoUser) {
        setUser({ id: demoUser.id, email: demoUser.email, name: demoUser.name, role: demoUser.role })
      }
    }
    setIsLoading(false)

    // Session timeout check
    const interval = setInterval(() => {
      if (!SecurityManager.validateSession()) {
        setUser(null)
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Validate inputs
    const emailValidation = Validator.validateEmail(email)
    if (!emailValidation.isValid) {
      return { success: false, error: emailValidation.error }
    }

    const passwordValidation = Validator.validatePassword(password)
    if (!passwordValidation.isValid) {
      return { success: false, error: passwordValidation.error }
    }

    // Check rate limiting
    if (!SecurityManager.checkRateLimit(`login_${email}`, 5, 60000)) {
      return { success: false, error: "Too many login attempts. Please try again later." }
    }

    // Check if account is locked
    const canAttempt = SecurityManager.recordLoginAttempt(email, false)
    if (!canAttempt) {
      return { success: false, error: "Account temporarily locked. Please try again in 15 minutes." }
    }

    // Find user (in production, this would be a secure API call)
    const demoUser = DEMO_USERS.find((u) => u.email === email && u.password === password)

    if (!demoUser) {
      return { success: false, error: "Invalid email or password" }
    }

    // Record successful attempt
    SecurityManager.recordLoginAttempt(email, true)

    // Set pending user for 2FA
    setPendingUser({ id: demoUser.id, email: demoUser.email, name: demoUser.name, role: demoUser.role })
    setNeedsTwoFactor(true)

    return { success: true }
  }

  const verify2FA = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!pendingUser) {
      return { success: false, error: "No pending login" }
    }

    // Validate 2FA code
    const codeValidation = Validator.validate2FACode(code)
    if (!codeValidation.isValid) {
      return { success: false, error: codeValidation.error }
    }

    // Check rate limiting
    if (!SecurityManager.checkRateLimit(`2fa_${pendingUser.email}`, 3, 60000)) {
      return { success: false, error: "Too many attempts. Please try again later." }
    }

    // Verify code (demo accepts '123456')
    if (code !== "123456") {
      return { success: false, error: "Invalid verification code" }
    }

    // Create session
    SecurityManager.createSession(pendingUser.id, pendingUser.email)

    // Generate CSRF token
    const csrfToken = SecurityManager.generateCSRFToken()
    SecurityManager.storeCSRFToken(csrfToken)

    setUser(pendingUser)
    setNeedsTwoFactor(false)
    setPendingUser(null)

    return { success: true }
  }

  const logout = () => {
    SecurityManager.destroySession()
    setUser(null)
    setNeedsTwoFactor(false)
    setPendingUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, needsTwoFactor, login, verify2FA, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

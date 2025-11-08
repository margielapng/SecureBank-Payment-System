"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { SecurityManager } from "./security"
import { Validator } from "./validation"

interface User {
  id: string
  email: string
  name: string
  role: "customer" | "admin"
  twoFactorEnabled?: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  needsTwoFactor: boolean
  needsTwoFactorSetup: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  verify2FA: (code: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)


const DEMO_USERS = [
  { id: "1", email: "john@bank.com", password: "SecurePass123!", name: "John Smith", role: "customer" as const },
  { id: "2", email: "admin@bank.com", password: "AdminPass123!", name: "Admin User", role: "admin" as const },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false)
  const [pendingUser, setPendingUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [needsTwoFactorSetup, setNeedsTwoFactorSetup] = useState(false)

  useEffect(() => {
   
    const session = SecurityManager.getSession()
    if (session) {
      const demoUser = DEMO_USERS.find((u) => u.email === session.email)
      if (demoUser) {
        setUser({ id: demoUser.id, email: demoUser.email, name: demoUser.name, role: demoUser.role })
      }
    }
    setIsLoading(false)

   
    const interval = setInterval(() => {
      if (!SecurityManager.validateSession()) {
        setUser(null)
      }
    }, 60000) 

    return () => clearInterval(interval)
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    
    const emailValidation = Validator.validateEmail(email)
    if (!emailValidation.isValid) {
      return { success: false, error: emailValidation.error }
    }

    const passwordValidation = Validator.validatePassword(password)
    if (!passwordValidation.isValid) {
      return { success: false, error: passwordValidation.error }
    }

    
    if (!SecurityManager.checkRateLimit(`login_${email}`, 5, 900000)) {
      return { success: false, error: "Too many login attempts. Please try again later." }
    }

    
    const canAttempt = SecurityManager.recordLoginAttempt(email, false)
    if (!canAttempt) {
      return { success: false, error: "Account temporarily locked. Please try again in 15 minutes." }
    }

    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || "Invalid email or password" }
      }

      
      SecurityManager.recordLoginAttempt(email, true)

      const apiUser = data.user as { id: string; email: string; name: string; role: "customer" | "admin"; twoFactorEnabled?: boolean }

      if (data.requiresTwoFactor) {
        
        setPendingUser({ id: apiUser.id, email: apiUser.email, name: apiUser.name, role: apiUser.role, twoFactorEnabled: apiUser.twoFactorEnabled })
        setNeedsTwoFactor(true)
        setNeedsTwoFactorSetup(false)
      } else {
        
        SecurityManager.createSession(apiUser.id, apiUser.email)
        const csrfToken = SecurityManager.generateCSRFToken()
        SecurityManager.storeCSRFToken(csrfToken)
        setUser({ id: apiUser.id, email: apiUser.email, name: apiUser.name, role: apiUser.role, twoFactorEnabled: apiUser.twoFactorEnabled })
        setNeedsTwoFactor(false)
        
        setNeedsTwoFactorSetup(apiUser.role === "admin" && !apiUser.twoFactorEnabled)
        setPendingUser(null)
      }

      return { success: true }
    } catch {
      return { success: false, error: "Network error. Please try again." }
    }
  }

  const verify2FA = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!pendingUser) {
      return { success: false, error: "No pending login" }
    }

    
    const codeValidation = Validator.validate2FACode(code)
    if (!codeValidation.isValid) {
      return { success: false, error: codeValidation.error }
    }

    
    if (!SecurityManager.checkRateLimit(`2fa_${pendingUser.email}`, 3, 60000)) {
      return { success: false, error: "Too many attempts. Please try again later." }
    }

    
    try {
      const res = await fetch("/api/auth/2fa/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingUserId: pendingUser.id, code }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Invalid verification code" }
      }
    } catch {
      return { success: false, error: "Network error. Please try again." }
    }

   
    SecurityManager.createSession(pendingUser.id, pendingUser.email)

    
    const csrfToken = SecurityManager.generateCSRFToken()
    SecurityManager.storeCSRFToken(csrfToken)

    setUser(pendingUser)
    setNeedsTwoFactor(false)
    setNeedsTwoFactorSetup(false)
    setPendingUser(null)

    return { success: true }
  }

  const logout = () => {
    SecurityManager.destroySession()
    setUser(null)
    setNeedsTwoFactor(false)
    setNeedsTwoFactorSetup(false)
    setPendingUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, needsTwoFactor, needsTwoFactorSetup, login, verify2FA, logout, isLoading }}
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

"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import LoginForm from "@/components/login-form"
import TwoFactorForm from "@/components/two-factor-form"
import { Shield, Lock, Globe, CheckCircle } from "lucide-react"

export default function HomePage() {
  const { isAuthenticated, needsTwoFactor, needsTwoFactorSetup, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (isAuthenticated && needsTwoFactorSetup) {
      router.push("/settings/security")
      return
    }
    if (isAuthenticated && !needsTwoFactor) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, needsTwoFactor, needsTwoFactorSetup, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left side - Branding */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary rounded-lg">
                  <Shield className="w-8 h-8 text-primary-foreground" />
                </div>
                <h1 className="text-4xl font-bold text-foreground">SecureBank</h1>
              </div>
              <p className="text-xl text-muted-foreground text-balance">
                Enterprise-grade international payment portal with bank-level security
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border">
                <Lock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-card-foreground">Bank-Level Security</h3>
                  <p className="text-sm text-muted-foreground">
                    Two-factor authentication, end-to-end encryption, and real-time fraud detection
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border">
                <Globe className="w-6 h-6 text-secondary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-card-foreground">Global Payments</h3>
                  <p className="text-sm text-muted-foreground">
                    Send payments in 8+ currencies with real-time exchange rates
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-card rounded-lg border border-border">
                <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-card-foreground">Instant Processing</h3>
                  <p className="text-sm text-muted-foreground">
                    Fast transaction processing with comprehensive audit trails
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Login/2FA Form */}
          <div className="max-w-md mx-auto w-full">{needsTwoFactor ? <TwoFactorForm /> : <LoginForm />}</div>
        </div>
      </div>
    </div>
  )
}

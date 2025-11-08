"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ShieldCheck } from "lucide-react"

export default function SecurityPage() {
  const { user } = useAuth()
  const [qr, setQr] = useState<string | null>(null)
  const [base32, setBase32] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [enabled, setEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    setError("")
    setSuccess("")
  }, [user])

  const startSetup = async () => {
    if (!user) return
    setIsLoading(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to start 2FA setup")
      } else {
        setQr(data.qrDataUrl)
        setBase32(data.base32)
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const verifySetup = async () => {
    if (!user) return
    setIsLoading(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/auth/2fa/verify-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, code }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || "Invalid code")
      } else {
        setEnabled(true)
        setSuccess("Two-factor authentication enabled.")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Manage two-factor authentication for your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user && <p className="text-sm">Please sign in to manage security settings.</p>}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <ShieldCheck className="h-4 w-4 inline mr-2" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {user && !qr && !enabled && (
            <Button onClick={startSetup} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...
                </>
              ) : (
                "Enable Two-Factor"
              )}
            </Button>
          )}

          {user && qr && !enabled && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="Scan QR with Authenticator app" className="border rounded" />
              </div>
              {base32 && (
                <p className="text-xs text-muted-foreground text-center">Manual entry code: {base32}</p>
              )}

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  maxLength={6}
                />
                <Button onClick={verifySetup} disabled={isLoading || code.length !== 6}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify
                </Button>
              </div>
            </div>
          )}

          {enabled && (
            <p className="text-sm text-muted-foreground">Two-factor authentication is enabled for your account.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

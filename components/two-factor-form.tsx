"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Shield } from "lucide-react"

export default function TwoFactorForm() {
  const { verify2FA } = useAuth()
  const router = useRouter()
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

  
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

   
    if (index === 5 && value) {
      const fullCode = newCode.join("")
      handleSubmit(fullCode)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return

    const newCode = pastedData.split("").concat(Array(6 - pastedData.length).fill(""))
    setCode(newCode.slice(0, 6))

    if (pastedData.length === 6) {
      handleSubmit(pastedData)
    } else {
      inputRefs.current[pastedData.length]?.focus()
    }
  }

  const handleSubmit = async (fullCode?: string) => {
    const codeToVerify = fullCode || code.join("")

    if (codeToVerify.length !== 6) {
      setError("Please enter all 6 digits")
      return
    }

    setError("")
    setIsLoading(true)

    const result = await verify2FA(codeToVerify)

    setIsLoading(false)

    if (!result.success) {
      setError(result.error || "Verification failed")
      setCode(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <Card className="border-2">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Shield className="w-8 h-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center">Two-Factor Authentication</CardTitle>
        <CardDescription className="text-center">
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-input rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed bg-background text-foreground"
              />
            ))}
          </div>

          <Button onClick={() => handleSubmit()} className="w-full" disabled={isLoading || code.some((d) => !d)}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Code"
            )}
          </Button>

          
        </div>
      </CardContent>
    </Card>
  )
}

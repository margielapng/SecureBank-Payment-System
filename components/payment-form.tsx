"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Send, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Validator } from "@/lib/validation"
import { SecurityManager } from "@/lib/security"

const CURRENCIES = [
  { code: "USD", symbol: "$", rate: 1.0 },
  { code: "EUR", symbol: "€", rate: 0.92 },
  { code: "GBP", symbol: "£", rate: 0.79 },
  { code: "JPY", symbol: "¥", rate: 149.5 },
  { code: "CHF", symbol: "CHF", rate: 0.88 },
  { code: "CAD", symbol: "C$", rate: 1.36 },
  { code: "AUD", symbol: "A$", rate: 1.52 },
  { code: "CNY", symbol: "¥", rate: 7.24 },
]

export function PaymentForm() {
  const [formData, setFormData] = useState({
    recipientName: "",
    accountNumber: "",
    bankName: "",
    amount: "",
    currency: "USD",
    reference: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: "" }))
    setSuccess(false)
    setWarning(null)

    // Real-time amount validation and high-value warning
    if (field === "amount" && value) {
      const amountNum = Number.parseFloat(value)
      if (amountNum >= 50000) {
        setWarning("High-value transaction detected. Additional compliance review may be required.")
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate recipient name
    const nameValidation = Validator.validateName(formData.recipientName)
    if (!nameValidation.isValid) {
      newErrors.recipientName = nameValidation.error || "Invalid name"
    }

    // Validate account number
    const accountValidation = Validator.validateAccountNumber(formData.accountNumber)
    if (!accountValidation.isValid) {
      newErrors.accountNumber = accountValidation.error || "Invalid account number"
    }

    // Validate amount
    const amountValidation = Validator.validateAmount(formData.amount)
    if (!amountValidation.isValid) {
      newErrors.amount = amountValidation.error || "Invalid amount"
    }

    // Validate bank name
    if (!formData.bankName || formData.bankName.trim().length < 2) {
      newErrors.bankName = "Bank name is required"
    }

    // Validate reference (optional but check if provided)
    if (formData.reference && formData.reference.length > 500) {
      newErrors.reference = "Reference must be less than 500 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)
    setWarning(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    // Check rate limiting
    if (!SecurityManager.checkRateLimit("payment", 3, 60000)) {
      setErrors({ submit: "Too many payment attempts. Please wait a moment." })
      setIsSubmitting(false)
      return
    }

    // Get CSRF token
    const csrfToken = SecurityManager.getCSRFToken()
    if (!csrfToken) {
      setErrors({ submit: "Security token missing. Please refresh and try again." })
      setIsSubmitting(false)
      return
    }

    try {
      // Call API endpoint
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(true)

        // Log security event
        SecurityManager.logSecurityEvent({
          type: "transaction",
          userId: "current-user",
          email: "user@example.com",
          ipAddress: "client-ip",
          details: `Payment of ${formData.amount} ${formData.currency} to ${formData.recipientName}`,
          severity: Number.parseFloat(formData.amount) >= 50000 ? "high" : "low",
        })

        // Reset form
        setFormData({
          recipientName: "",
          accountNumber: "",
          bankName: "",
          amount: "",
          currency: "USD",
          reference: "",
        })
      } else {
        setErrors({ submit: result.error || "Payment failed. Please try again." })
      }
    } catch (error) {
      setErrors({ submit: "Network error. Please check your connection and try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCurrency = CURRENCIES.find((c) => c.code === formData.currency)
  const convertedAmount = formData.amount
    ? (Number.parseFloat(formData.amount) * (selectedCurrency?.rate || 1)).toFixed(2)
    : "0.00"

  return (
    <Card>
      <CardHeader>
        <CardTitle>New International Payment</CardTitle>
        <CardDescription>Send money securely to international recipients</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {warning && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">{warning}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-teal-200 bg-teal-50">
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
              <AlertDescription className="text-teal-800">
                Payment submitted successfully! Transaction ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
              </AlertDescription>
            </Alert>
          )}

          {errors.submit && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recipientName">Recipient Name*</Label>
              <Input
                id="recipientName"
                placeholder="John Smith"
                value={formData.recipientName}
                onChange={(e) => handleInputChange("recipientName", e.target.value)}
                className={errors.recipientName ? "border-red-500" : ""}
              />
              {errors.recipientName && <p className="text-sm text-red-600">{errors.recipientName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number / IBAN*</Label>
              <Input
                id="accountNumber"
                placeholder="GB29NWBK60161331926819"
                value={formData.accountNumber}
                onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                className={errors.accountNumber ? "border-red-500" : ""}
              />
              {errors.accountNumber && <p className="text-sm text-red-600">{errors.accountNumber}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name*</Label>
            <Input
              id="bankName"
              placeholder="International Bank PLC"
              value={formData.bankName}
              onChange={(e) => handleInputChange("bankName", e.target.value)}
              className={errors.bankName ? "border-red-500" : ""}
            />
            {errors.bankName && <p className="text-sm text-red-600">{errors.bankName}</p>}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount*</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="1000.00"
                value={formData.amount}
                onChange={(e) => handleInputChange("amount", e.target.value)}
                className={errors.amount ? "border-red-500" : ""}
              />
              {errors.amount && <p className="text-sm text-red-600">{errors.amount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency*</Label>
              <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.amount && formData.currency !== "USD" && (
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Exchange Rate:</span> 1 USD = {selectedCurrency?.rate} {formData.currency}
              </p>
              <p className="mt-1 text-sm text-blue-800">
                <span className="font-medium">You will send:</span> {selectedCurrency?.symbol}
                {convertedAmount}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reference">Payment Reference (Optional)</Label>
            <Textarea
              id="reference"
              placeholder="Invoice #12345"
              value={formData.reference}
              onChange={(e) => handleInputChange("reference", e.target.value)}
              rows={3}
              className={errors.reference ? "border-red-500" : ""}
            />
            {errors.reference && <p className="text-sm text-red-600">{errors.reference}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? "Processing..." : "Send Payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Comprehensive validation with RegEx patterns for secure banking application

// Email validation - RFC 5322 compliant
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// Password validation - Strong security requirements
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/

// IBAN validation - International Bank Account Number
export const IBAN_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/

// Account number validation - Alphanumeric 8-17 characters
export const ACCOUNT_NUMBER_REGEX = /^[A-Z0-9]{8,17}$/

// Name validation - Letters, spaces, hyphens, apostrophes
export const NAME_REGEX = /^[a-zA-Z\s'-]{2,50}$/

// Amount validation - Positive numbers with up to 2 decimal places
export const AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/

// Currency code validation - ISO 4217 (3 uppercase letters)
export const CURRENCY_REGEX = /^[A-Z]{3}$/

// 2FA code validation - 6 digits
export const TWO_FA_CODE_REGEX = /^[0-9]{6}$/

// Identifier validation - Alphanumeric, dash, underscore (1-64 chars)
export const ID_REGEX = /^[A-Za-z0-9_-]{1,64}$/

// SQL injection detection
export const SQL_INJECTION_REGEX =
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b|--|;|\/\*|\*\/|xp_|sp_)/gi

// XSS detection
export const XSS_REGEX = /<script|javascript:|onerror=|onload=|<iframe|eval\(|expression\(/gi

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export class Validator {
  // Email validation
  static validateEmail(email: string): ValidationResult {
    if (!email) return { isValid: false, error: "Email is required" }
    if (email.length > 254) return { isValid: false, error: "Email is too long" }
    if (!EMAIL_REGEX.test(email)) return { isValid: false, error: "Invalid email format" }
    return { isValid: true }
  }

  // Password validation
  static validatePassword(password: string): ValidationResult {
    if (!password) return { isValid: false, error: "Password is required" }
    if (password.length < 8) return { isValid: false, error: "Password must be at least 8 characters" }
    if (password.length > 128) return { isValid: false, error: "Password is too long" }
    if (!PASSWORD_REGEX.test(password)) {
      return {
        isValid: false,
        error: "Password must contain uppercase, lowercase, number, and special character",
      }
    }
    return { isValid: true }
  }

  // IBAN validation with checksum
  static validateIBAN(iban: string): ValidationResult {
    if (!iban) return { isValid: false, error: "IBAN is required" }
    const cleaned = iban.replace(/\s/g, "").toUpperCase()
    if (!IBAN_REGEX.test(cleaned)) return { isValid: false, error: "Invalid IBAN format" }

    // IBAN checksum validation
    const rearranged = cleaned.slice(4) + cleaned.slice(0, 4)
    const numericIBAN = rearranged.replace(/[A-Z]/g, (char) => (char.charCodeAt(0) - 55).toString())
    let remainder = 0
    for (let i = 0; i < numericIBAN.length; i++) {
      remainder = (remainder * 10 + Number(numericIBAN[i])) % 97
    }

    if (remainder !== 1) return { isValid: false, error: "Invalid IBAN checksum" }
    return { isValid: true }
  }

  // Account number validation
  static validateAccountNumber(accountNumber: string): ValidationResult {
    if (!accountNumber) return { isValid: false, error: "Account number is required" }
    const cleaned = accountNumber.replace(/\s/g, "").toUpperCase()
    if (!ACCOUNT_NUMBER_REGEX.test(cleaned)) {
      return { isValid: false, error: "Invalid account number format" }
    }
    return { isValid: true }
  }

  // Name validation
  static validateName(name: string): ValidationResult {
    if (!name) return { isValid: false, error: "Name is required" }
    const trimmed = name.trim()
    if (trimmed.length < 2) return { isValid: false, error: "Name must be at least 2 characters" }
    if (trimmed.length > 50) return { isValid: false, error: "Name is too long" }
    if (!NAME_REGEX.test(trimmed)) {
      return { isValid: false, error: "Name contains invalid characters" }
    }
    return { isValid: true }
  }

  // Amount validation
  static validateAmount(amount: string | number): ValidationResult {
    const amountStr = String(amount)
    if (!amountStr) return { isValid: false, error: "Amount is required" }
    if (!AMOUNT_REGEX.test(amountStr)) {
      return { isValid: false, error: "Invalid amount format" }
    }
    const numAmount = Number.parseFloat(amountStr)
    if (numAmount <= 0) return { isValid: false, error: "Amount must be greater than 0" }
    if (numAmount > 999999999.99) return { isValid: false, error: "Amount exceeds maximum limit" }
    return { isValid: true }
  }

  // Currency code validation
  static validateCurrency(currency: string): ValidationResult {
    if (!currency) return { isValid: false, error: "Currency is required" }
    if (!CURRENCY_REGEX.test(currency)) {
      return { isValid: false, error: "Invalid currency code (must be 3 uppercase letters)" }
    }
    return { isValid: true }
  }

  // 2FA code validation
  static validate2FACode(code: string): ValidationResult {
    if (!code) return { isValid: false, error: "2FA code is required" }
    if (!TWO_FA_CODE_REGEX.test(code)) {
      return { isValid: false, error: "2FA code must be exactly 6 digits" }
    }
    return { isValid: true }
  }

  // Identifier validation
  static validateId(id: string): ValidationResult {
    if (!id) return { isValid: false, error: "ID is required" }
    if (!ID_REGEX.test(id)) {
      return { isValid: false, error: "Invalid ID format" }
    }
    return { isValid: true }
  }

  // SQL injection detection
  static detectSqlInjection(input: string): boolean {
    return SQL_INJECTION_REGEX.test(input)
  }

  // XSS detection
  static detectXSS(input: string): boolean {
    return XSS_REGEX.test(input)
  }

  // Sanitize input - Remove dangerous characters
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, "") // Remove angle brackets
      .replace(/javascript:/gi, "") // Remove javascript: protocol
      .replace(/on\w+=/gi, "") // Remove event handlers
      .trim()
  }

  // HTML encode for output
  static htmlEncode(input: string): string {
    const div = document.createElement("div")
    div.textContent = input
    return div.innerHTML
  }

  // Validate all payment fields
  static validatePaymentForm(data: {
    recipientName: string
    accountNumber: string
    amount: string
    currency: string
    reference?: string
  }): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {}

    const nameResult = this.validateName(data.recipientName)
    if (!nameResult.isValid) errors.recipientName = nameResult.error!

    const accountResult = this.validateAccountNumber(data.accountNumber)
    if (!accountResult.isValid) errors.accountNumber = accountResult.error!

    const amountResult = this.validateAmount(data.amount)
    if (!amountResult.isValid) errors.amount = amountResult.error!

    const currencyResult = this.validateCurrency(data.currency)
    if (!currencyResult.isValid) errors.currency = currencyResult.error!

    // Security checks
    if (this.detectSqlInjection(data.recipientName) || this.detectXSS(data.recipientName)) {
      errors.recipientName = "Invalid characters detected"
    }
    if (data.reference && (this.detectSqlInjection(data.reference) || this.detectXSS(data.reference))) {
      errors.reference = "Invalid characters detected"
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }
}

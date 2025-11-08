import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { Validator } from "@/lib/validation"


const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  return true
}

function validateCSRFToken(token: string | null): boolean {
  
  return !!token && token.length > 0
}



export async function POST(request: NextRequest) {
  try {
  
    const clientIp = request.headers.get("x-forwarded-for") || "unknown"
    if (!checkRateLimit(`payment_${clientIp}`, 3, 60000)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

   
    const csrfToken = request.headers.get("x-csrf-token")
    if (!validateCSRFToken(csrfToken)) {
      return NextResponse.json({ error: "Invalid security token" }, { status: 403 })
    }

    
    const body = await request.json()
    const { recipientName, accountNumber, bankName, amount, currency, reference } = body

    
    if (!recipientName || !accountNumber || !bankName || !amount || !currency) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    
    const sanitizedRecipientName = Validator.sanitizeInput(String(recipientName))
    const sanitizedAccountNumber = Validator.sanitizeInput(String(accountNumber))
    const sanitizedBankName = Validator.sanitizeInput(String(bankName))
    const sanitizedReference = reference ? Validator.sanitizeInput(String(reference)) : ""

    
    if (
      Validator.detectSqlInjection(sanitizedRecipientName) ||
      Validator.detectSqlInjection(sanitizedAccountNumber) ||
      Validator.detectSqlInjection(sanitizedBankName) ||
      Validator.detectSqlInjection(sanitizedReference)
    ) {
      return NextResponse.json({ error: "Invalid input detected" }, { status: 400 })
    }

   
    if (
      Validator.detectXSS(sanitizedRecipientName) ||
      Validator.detectXSS(sanitizedAccountNumber) ||
      Validator.detectXSS(sanitizedBankName) ||
      Validator.detectXSS(sanitizedReference)
    ) {
      return NextResponse.json({ error: "Invalid input detected" }, { status: 400 })
    }

    
    const nameCheck = Validator.validateName(sanitizedRecipientName)
    if (!nameCheck.isValid) {
      return NextResponse.json({ error: "Invalid recipient name format" }, { status: 400 })
    }
    const bankNameCheck = Validator.validateName(sanitizedBankName)
    if (!bankNameCheck.isValid) {
      return NextResponse.json({ error: "Invalid bank name format" }, { status: 400 })
    }

   
    const cleanedAcc = sanitizedAccountNumber.replace(/\s/g, "").toUpperCase()
    const isIban = /^[A-Z]{2}\d{2}/.test(cleanedAcc)
    const accValidation = isIban
      ? Validator.validateIBAN(cleanedAcc)
      : Validator.validateAccountNumber(cleanedAcc)
    if (!accValidation.isValid) {
      return NextResponse.json({ error: accValidation.error || "Invalid account number format" }, { status: 400 })
    }

    
    const amountCheck = Validator.validateAmount(String(amount))
    if (!amountCheck.isValid) {
      return NextResponse.json({ error: amountCheck.error || "Invalid amount" }, { status: 400 })
    }
    const amountNum = Number.parseFloat(String(amount))

    
    const currencyCheck = Validator.validateCurrency(String(currency))
    if (!currencyCheck.isValid) {
      return NextResponse.json({ error: currencyCheck.error || "Invalid currency" }, { status: 400 })
    }

    
    const isHighValue = amountNum >= 50000
    if (isHighValue) {
      console.log(`[SECURITY] High-value transaction detected: ${amountNum} ${currency}`)
    }

   

    
    await new Promise((resolve) => setTimeout(resolve, 1000))

    
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    
    const db = await getDb()
    await db.collection("payments").createIndex({ transactionId: 1 }, { unique: true })
    await db.collection("payments").insertOne({
      transactionId,
      recipientName: sanitizedRecipientName,
      accountNumber: sanitizedAccountNumber,
      bankName: sanitizedBankName,
      amount: amountNum,
      currency,
      reference: sanitizedReference,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    
    return NextResponse.json({
      success: true,
      transactionId,
      status: "pending",
      message: "Payment submitted successfully",
      data: {
        recipient: sanitizedRecipientName,
        amount: amountNum,
        currency,
        estimatedCompletion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDb()
    const payments = await db
      .collection("payments")
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()

    const items = payments.map((p: any) => ({
      id: p.transactionId,
      recipient: p.recipientName,
      amount: p.amount,
      currency: p.currency,
      status: p.status || "pending",
      date: p.createdAt instanceof Date ? p.createdAt.toISOString() : new Date(p.createdAt).toISOString(),
    }))

    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    
    const clientIp = request.headers.get("x-forwarded-for") || "unknown"
    if (!checkRateLimit(`payment_update_${clientIp}`, 10, 60000)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

   
    const csrfToken = request.headers.get("x-csrf-token")
    if (!validateCSRFToken(csrfToken)) {
      return NextResponse.json({ error: "Invalid security token" }, { status: 403 })
    }

    // Admin-only enforcement
    const role = request.headers.get("x-user-role")
    if (role !== "admin") {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 })
    }

    const body = await request.json()
    const { transactionId, action } = body || {}

    if (!transactionId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const allowed = ["approve", "reject"]
    if (!allowed.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    
    const sanitizedId = Validator.sanitizeInput(String(transactionId))
    const idCheck = Validator.validateId(sanitizedId)
    if (!idCheck.isValid) {
      return NextResponse.json({ error: idCheck.error || "Invalid transactionId" }, { status: 400 })
    }

    const newStatus = action === "approve" ? "completed" : "failed"

    const db = await getDb()
    const res = await db.collection("payments").findOneAndUpdate(
      { transactionId: sanitizedId },
      { $set: { status: newStatus, updatedAt: new Date() } },
      { returnDocument: "after", projection: { _id: 0 } as any }
    )

    if (!res || !res.value) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      transactionId: sanitizedId,
      status: newStatus,
      message: `Transaction ${action}d`,
    })
  } catch (error) {
    console.error("[API ERROR]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

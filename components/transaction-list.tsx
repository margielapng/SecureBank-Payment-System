"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, XCircle, Eye } from "lucide-react"
import { TransactionDetailsModal } from "@/components/transaction-details-modal"

const DEMO_TRANSACTIONS = [
  {
    id: "TXN-2025-001",
    date: "2025-01-08 14:32",
    recipient: "Acme Corporation Ltd",
    account: "GB29NWBK60161331926819",
    amount: 12500.0,
    currency: "USD",
    status: "completed",
    type: "sent",
    reference: "Invoice #INV-2025-001",
  },
  {
    id: "TXN-2025-002",
    date: "2025-01-08 11:15",
    recipient: "Global Trade Inc",
    account: "DE89370400440532013000",
    amount: 8350.0,
    currency: "EUR",
    status: "pending",
    type: "sent",
    reference: "Payment for services",
  },
  {
    id: "TXN-2025-003",
    date: "2025-01-07 16:45",
    recipient: "Tech Solutions UK",
    account: "GB82WEST12345698765432",
    amount: 5200.0,
    currency: "GBP",
    status: "completed",
    type: "sent",
    reference: "Contract payment Q4",
  },
  {
    id: "TXN-2025-004",
    date: "2025-01-07 09:20",
    recipient: "Manufacturing Co",
    account: "US64SVBKUS6S3300958879",
    amount: 3750.0,
    currency: "USD",
    status: "failed",
    type: "sent",
    reference: "Equipment purchase",
  },
  {
    id: "TXN-2025-005",
    date: "2025-01-06 13:50",
    recipient: "Swiss Service Provider",
    account: "CH9300762011623852957",
    amount: 2100.0,
    currency: "CHF",
    status: "pending",
    type: "sent",
    reference: "Monthly subscription",
  },
]

export function TransactionList() {
  const [selectedTransaction, setSelectedTransaction] = useState<(typeof DEMO_TRANSACTIONS)[0] | null>(null)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-teal-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-amber-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-teal-50 text-teal-700 hover:bg-teal-100">Completed</Badge>
      case "pending":
        return <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-50 text-red-700 hover:bg-red-100">Failed</Badge>
      default:
        return null
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DEMO_TRANSACTIONS.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(transaction.status)}
                  <div>
                    <p className="font-medium text-slate-900">{transaction.recipient}</p>
                    <p className="text-sm text-slate-500">{transaction.id}</p>
                    <p className="mt-1 text-xs text-slate-400">{transaction.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {transaction.currency === "USD" ? "$" : ""}
                      {transaction.currency === "EUR" ? "€" : ""}
                      {transaction.currency === "GBP" ? "£" : ""}
                      {transaction.amount.toLocaleString()}
                      {transaction.currency === "CHF" ? " CHF" : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{transaction.currency}</p>
                  </div>

                  {getStatusBadge(transaction.status)}

                  <Button variant="ghost" size="sm" onClick={() => setSelectedTransaction(transaction)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedTransaction && (
        <TransactionDetailsModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
      )}
    </>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, XCircle, ArrowUpRight } from "lucide-react"

const DEMO_TRANSACTIONS = [
  {
    id: "TXN-2025-001",
    recipient: "Acme Corp Ltd",
    amount: "$12,500.00",
    currency: "USD",
    status: "completed",
    date: "2025-01-08",
  },
  {
    id: "TXN-2025-002",
    recipient: "Global Trade Inc",
    amount: "€8,350.00",
    currency: "EUR",
    status: "pending",
    date: "2025-01-08",
  },
  {
    id: "TXN-2025-003",
    recipient: "Tech Solutions",
    amount: "£5,200.00",
    currency: "GBP",
    status: "completed",
    date: "2025-01-07",
  },
  {
    id: "TXN-2025-004",
    recipient: "Manufacturing Co",
    amount: "$3,750.00",
    currency: "USD",
    status: "failed",
    date: "2025-01-07",
  },
  {
    id: "TXN-2025-005",
    recipient: "Service Provider",
    amount: "CHF 2,100.00",
    currency: "CHF",
    status: "pending",
    date: "2025-01-06",
  },
]

export function RecentTransactions() {
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
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest payment activity</CardDescription>
        </div>
        <ArrowUpRight className="h-5 w-5 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {DEMO_TRANSACTIONS.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-start justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{getStatusIcon(transaction.status)}</div>
                <div>
                  <p className="font-medium text-slate-900">{transaction.recipient}</p>
                  <p className="text-sm text-slate-500">{transaction.id}</p>
                  <p className="mt-1 text-xs text-slate-400">{transaction.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{transaction.amount}</p>
                <div className="mt-1">{getStatusBadge(transaction.status)}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

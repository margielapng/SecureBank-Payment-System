"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Eye } from "lucide-react"

const FLAGGED_TRANSACTIONS = [
  {
    id: "TXN-2025-089",
    recipient: "Overseas Trading LLC",
    amount: "$75,000.00",
    reason: "High-value transaction",
    risk: "medium",
    date: "2025-01-08",
  },
  {
    id: "TXN-2025-091",
    recipient: "Unknown Entity",
    amount: "$52,000.00",
    reason: "Suspicious recipient",
    risk: "high",
    date: "2025-01-08",
  },
  {
    id: "TXN-2025-095",
    recipient: "Rapid Transfers Inc",
    amount: "$45,000.00",
    reason: "Multiple rapid transactions",
    risk: "high",
    date: "2025-01-07",
  },
]

export function FlaggedTransactions() {
  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "high":
        return <Badge className="bg-red-50 text-red-700">High Risk</Badge>
      case "medium":
        return <Badge className="bg-amber-50 text-amber-700">Medium Risk</Badge>
      case "low":
        return <Badge className="bg-blue-50 text-blue-700">Low Risk</Badge>
      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flagged Transactions</CardTitle>
        <CardDescription>Transactions requiring compliance review</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {FLAGGED_TRANSACTIONS.map((transaction) => (
            <div
              key={transaction.id}
              className="rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{transaction.recipient}</p>
                    {getRiskBadge(transaction.risk)}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{transaction.id}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    <span className="font-medium">Reason:</span> {transaction.reason}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{transaction.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{transaction.amount}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button size="sm" className="flex-1 bg-teal-600 hover:bg-teal-700">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button variant="destructive" size="sm" className="flex-1">
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

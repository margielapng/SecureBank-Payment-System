"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, XCircle, Download, Copy } from "lucide-react"

interface Transaction {
  id: string
  date: string
  recipient: string
  account: string
  amount: number
  currency: string
  status: string
  type: string
  reference: string
}

interface TransactionDetailsModalProps {
  transaction: Transaction
  onClose: () => void
}

export function TransactionDetailsModal({ transaction, onClose }: TransactionDetailsModalProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-teal-600" />
      case "pending":
        return <Clock className="h-5 w-5 text-amber-600" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-teal-50 text-teal-700">Completed</Badge>
      case "pending":
        return <Badge className="bg-amber-50 text-amber-700">Pending</Badge>
      case "failed":
        return <Badge className="bg-red-50 text-red-700">Failed</Badge>
      default:
        return null
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>Complete information for transaction {transaction.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(transaction.status)}
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <div className="mt-1">{getStatusBadge(transaction.status)}</div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">
                {transaction.currency === "USD" ? "$" : ""}
                {transaction.currency === "EUR" ? "€" : ""}
                {transaction.currency === "GBP" ? "£" : ""}
                {transaction.amount.toLocaleString()}
                {transaction.currency === "CHF" ? " CHF" : ""}
              </p>
              <p className="text-sm text-slate-500">{transaction.currency}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-600">Transaction ID</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-sm text-slate-900">{transaction.id}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(transaction.id)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600">Date & Time</p>
              <p className="mt-1 text-sm text-slate-900">{transaction.date}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600">Recipient</p>
              <p className="mt-1 text-sm text-slate-900">{transaction.recipient}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600">Account Number</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-sm text-slate-900">{transaction.account}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => copyToClipboard(transaction.account)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-slate-600">Reference</p>
              <p className="mt-1 text-sm text-slate-900">{transaction.reference}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 bg-transparent">
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

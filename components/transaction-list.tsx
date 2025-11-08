"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, XCircle } from "lucide-react"

type Tx = {
  id: string
  recipient: string
  amount: number
  currency: string
  status: string
  date: string
}

export function TransactionList() {
  const [items, setItems] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        const res = await fetch("/api/payment", { method: "GET" })
        const data = await res.json()
        if (res.ok && data?.items && Array.isArray(data.items)) {
          if (isMounted) setItems(data.items as Tx[])
        }
      } catch {}
      finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

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
            {loading && items.length === 0 && (
              <div className="text-sm text-slate-500">Loading...</div>
            )}
            {!loading && items.length === 0 && (
              <div className="text-sm text-slate-500">No transactions yet.</div>
            )}
            {items.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(transaction.status)}
                  <div>
                    <p className="font-medium text-slate-900">{transaction.recipient}</p>
                    <p className="text-sm text-slate-500">{transaction.id}</p>
                    <p className="mt-1 text-xs text-slate-400">{new Date(transaction.date).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{transaction.currency} {Number(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="mt-1 text-xs text-slate-500">{transaction.currency}</p>
                  </div>

                  {getStatusBadge(transaction.status)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

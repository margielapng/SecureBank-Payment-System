"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Eye } from "lucide-react"
import { SecurityManager } from "@/lib/security"
import { useAuth } from "@/lib/auth-context"

type Tx = {
  id: string
  recipient: string
  amount: number
  currency: string
  status: string
  date: string
}

export function FlaggedTransactions() {
  const [items, setItems] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    let isMounted = true
    async function load() {
      try {
        const res = await fetch("/api/payment", { method: "GET" })
        const data = await res.json()
        if (res.ok && Array.isArray(data?.items)) {
          const pending = data.items.filter((t: Tx) => t.status === "pending")
          if (isMounted) setItems(pending)
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

  const formatAmount = (tx: Tx) => `${tx.currency} ${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const approveOrReject = async (transactionId: string, action: "approve" | "reject") => {
    let csrfToken = SecurityManager.getCSRFToken()
    if (!csrfToken) {
      const newToken = SecurityManager.generateCSRFToken()
      SecurityManager.storeCSRFToken(newToken)
      csrfToken = newToken
    }
    setUpdatingId(transactionId)
    // optimistic remove from list
    const prev = items
    setItems((curr) => curr.filter((t) => t.id !== transactionId))
    try {
      const res = await fetch("/api/payment", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
          "X-User-Role": user?.role || "customer",
        },
        body: JSON.stringify({ transactionId, action }),
      })
      if (!res.ok) {
        // revert on error
        setItems(prev)
      }
    } catch {
      setItems(prev)
    } finally {
      setUpdatingId(null)
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
          {loading && items.length === 0 && (
            <div className="text-sm text-slate-500">Loading...</div>
          )}
          {!loading && items.length === 0 && (
            <div className="text-sm text-slate-500">No pending transactions.</div>
          )}
          {items.map((transaction) => (
            <div
              key={transaction.id}
              className="rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{transaction.recipient}</p>
                    <Badge className="bg-amber-50 text-amber-700">Pending Review</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{transaction.id}</p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(transaction.date).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{formatAmount(transaction)}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button size="sm" className="flex-1 bg-teal-600 hover:bg-teal-700" disabled={updatingId === transaction.id} onClick={() => approveOrReject(transaction.id, "approve")}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button variant="destructive" size="sm" className="flex-1" disabled={updatingId === transaction.id} onClick={() => approveOrReject(transaction.id, "reject")}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button variant="outline" size="sm" disabled>
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

"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { TransactionStats } from "@/components/transaction-stats"
import { TransactionFilters } from "@/components/transaction-filters"
import { TransactionList } from "@/components/transaction-list"

export default function TransactionsPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <DashboardHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Transaction History</h1>
          <p className="mt-2 text-slate-600">View and manage all your international payments</p>
        </div>

        <TransactionStats />

        <div className="mt-8">
          <TransactionFilters />
        </div>

        <div className="mt-6">
          <TransactionList />
        </div>
      </main>
    </div>
  )
}

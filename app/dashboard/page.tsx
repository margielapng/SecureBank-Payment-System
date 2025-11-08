"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { QuickStats } from "@/components/quick-stats"
import { PaymentForm } from "@/components/payment-form"
import { RecentTransactions } from "@/components/recent-transactions"

export default function DashboardPage() {
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
        <QuickStats />

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PaymentForm />
          </div>

          <div className="lg:col-span-1">
            <RecentTransactions />
          </div>
        </div>
      </main>
    </div>
  )
}

"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { ComplianceStats } from "@/components/compliance-stats"
import { FlaggedTransactions } from "@/components/flagged-transactions"
import { RiskAssessment } from "@/components/risk-assessment"

export default function CompliancePage() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, isLoading, user, router])

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

  if (!isAuthenticated || user?.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <DashboardHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Risk & Compliance</h1>
          <p className="mt-2 text-slate-600">Monitor flagged transactions and assess risk levels</p>
        </div>

        <ComplianceStats />

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FlaggedTransactions />
          </div>

          <div className="lg:col-span-1">
            <RiskAssessment />
          </div>
        </div>
      </main>
    </div>
  )
}

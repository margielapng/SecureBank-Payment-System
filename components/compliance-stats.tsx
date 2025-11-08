"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, ShieldCheck, TrendingUp, FileWarning } from "lucide-react"

export function ComplianceStats() {
  const stats = [
    {
      label: "Flagged Transactions",
      value: "7",
      change: "-3 from yesterday",
      icon: AlertTriangle,
      color: "amber",
    },
    {
      label: "Under Review",
      value: "3",
      change: "+1 pending",
      icon: FileWarning,
      color: "blue",
    },
    {
      label: "Resolved Today",
      value: "12",
      change: "+5 approved",
      icon: ShieldCheck,
      color: "teal",
    },
    {
      label: "Risk Score",
      value: "Low",
      change: "2.3/10 average",
      icon: TrendingUp,
      color: "teal",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="mt-1 text-xs text-slate-500">{stat.change}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

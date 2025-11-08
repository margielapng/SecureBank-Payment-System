"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react"

export function TransactionStats() {
  const stats = [
    {
      label: "Total Sent",
      value: "$245,680.00",
      change: "+15.3%",
      trend: "up",
      icon: TrendingUp,
    },
    {
      label: "Total Received",
      value: "$189,420.00",
      change: "+8.7%",
      trend: "up",
      icon: TrendingDown,
    },
    {
      label: "Transaction Count",
      value: "142",
      change: "+12",
      trend: "up",
      icon: Activity,
    },
    {
      label: "Average Transaction",
      value: "$3,060.00",
      change: "-2.1%",
      trend: "down",
      icon: DollarSign,
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
                <span className={`text-sm font-medium ${stat.trend === "up" ? "text-teal-600" : "text-slate-500"}`}>
                  {stat.change}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

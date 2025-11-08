"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp } from "lucide-react"

export function QuickStats() {
  const stats = [
    {
      label: "Available Balance",
      value: "$125,430.50",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
    },
    {
      label: "Pending Transactions",
      value: "8",
      change: "-2",
      trend: "down",
      icon: TrendingUp,
    },
    {
      label: "This Month",
      value: "$45,280.00",
      change: "+8.2%",
      trend: "up",
      icon: ArrowUpRight,
    },
    {
      label: "Last Month",
      value: "$38,150.00",
      change: "+5.1%",
      trend: "up",
      icon: ArrowDownRight,
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

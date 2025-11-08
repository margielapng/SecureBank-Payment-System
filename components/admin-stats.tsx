"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, Activity, AlertTriangle, DollarSign } from "lucide-react"

export function AdminStats() {
  const stats = [
    {
      label: "Total Users",
      value: "1,245",
      change: "+12",
      icon: Users,
      color: "blue",
    },
    {
      label: "Active Sessions",
      value: "89",
      change: "+5",
      icon: Activity,
      color: "teal",
    },
    {
      label: "Flagged Transactions",
      value: "7",
      change: "-3",
      icon: AlertTriangle,
      color: "amber",
    },
    {
      label: "Total Volume Today",
      value: "$2.4M",
      change: "+18%",
      icon: DollarSign,
      color: "blue",
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
                <span className="text-sm font-medium text-teal-600">{stat.change}</span>
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

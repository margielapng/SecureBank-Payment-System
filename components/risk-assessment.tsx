"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, TrendingUp, Globe, Users } from "lucide-react"

const RISK_FACTORS = [
  {
    id: "1",
    factor: "High-value transactions",
    count: 7,
    severity: "medium",
    icon: AlertTriangle,
  },
  {
    id: "2",
    factor: "Transaction frequency",
    count: 3,
    severity: "low",
    icon: TrendingUp,
  },
  {
    id: "3",
    factor: "Geographic diversity",
    count: 2,
    severity: "low",
    icon: Globe,
  },
  {
    id: "4",
    factor: "New user activity",
    count: 5,
    severity: "medium",
    icon: Users,
  },
]

export function RiskAssessment() {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge className="bg-red-50 text-red-700">High</Badge>
      case "medium":
        return <Badge className="bg-amber-50 text-amber-700">Medium</Badge>
      case "low":
        return <Badge className="bg-blue-50 text-blue-700">Low</Badge>
      default:
        return null
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Risk Assessment</CardTitle>
        <CardDescription>Active risk factors requiring monitoring</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 rounded-lg bg-teal-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-teal-900">Overall Risk Level</p>
              <p className="mt-1 text-2xl font-bold text-teal-900">Low</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600">
              <span className="text-lg font-bold text-white">2.3</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-teal-700">Out of 10 - Below industry average</p>
        </div>

        <div className="space-y-3">
          {RISK_FACTORS.map((risk) => {
            const Icon = risk.icon
            return (
              <div
                key={risk.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-slate-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{risk.factor}</p>
                    <p className="text-xs text-slate-500">{risk.count} detected</p>
                  </div>
                </div>
                {getSeverityBadge(risk.severity)}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

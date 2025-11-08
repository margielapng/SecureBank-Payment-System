"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, UserCheck, AlertTriangle, Activity } from "lucide-react"

const DEMO_ACTIVITY = [
  {
    id: "1",
    type: "security",
    message: "Failed login attempt detected",
    user: "unknown@example.com",
    time: "2 minutes ago",
    severity: "high",
  },
  {
    id: "2",
    type: "user",
    message: "User account created",
    user: "newuser@company.com",
    time: "15 minutes ago",
    severity: "low",
  },
  {
    id: "3",
    type: "transaction",
    message: "High-value transaction flagged",
    user: "john@bank.com",
    time: "32 minutes ago",
    severity: "medium",
  },
  {
    id: "4",
    type: "system",
    message: "System backup completed",
    user: "system",
    time: "1 hour ago",
    severity: "low",
  },
  {
    id: "5",
    type: "security",
    message: "Account locked due to suspicious activity",
    user: "suspicious@test.com",
    time: "2 hours ago",
    severity: "high",
  },
]

export function SystemActivity() {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "security":
        return <Shield className="h-4 w-4 text-red-600" />
      case "user":
        return <UserCheck className="h-4 w-4 text-blue-600" />
      case "transaction":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />
      case "system":
        return <Activity className="h-4 w-4 text-teal-600" />
      default:
        return null
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge className="bg-red-50 text-red-700">High</Badge>
      case "medium":
        return <Badge className="bg-amber-50 text-amber-700">Medium</Badge>
      case "low":
        return <Badge className="bg-slate-50 text-slate-700">Low</Badge>
      default:
        return null
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>System Activity</CardTitle>
        <CardDescription>Recent security and system events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {DEMO_ACTIVITY.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
            >
              <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{activity.message}</p>
                <p className="text-xs text-slate-500">{activity.user}</p>
                <p className="mt-1 text-xs text-slate-400">{activity.time}</p>
              </div>
              {getSeverityBadge(activity.severity)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

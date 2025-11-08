"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, UserCheck, UserX } from "lucide-react"

const DEMO_USERS = [
  { id: "1", name: "John Smith", email: "john@bank.com", status: "active", transactions: 45, volume: "$125,400" },
  { id: "2", name: "Sarah Johnson", email: "sarah@company.com", status: "active", transactions: 32, volume: "$89,200" },
  {
    id: "3",
    name: "Michael Chen",
    email: "michael@tech.com",
    status: "suspended",
    transactions: 18,
    volume: "$45,800",
  },
  { id: "4", name: "Emma Wilson", email: "emma@global.com", status: "active", transactions: 67, volume: "$234,500" },
  { id: "5", name: "David Brown", email: "david@trade.com", status: "active", transactions: 28, volume: "$67,300" },
]

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState(DEMO_USERS)

  const toggleUserStatus = (userId: string) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, status: user.status === "active" ? "suspended" : "active" } : user,
      ),
    )
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage user accounts and permissions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50"
            >
              <div>
                <p className="font-medium text-slate-900">{user.name}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
                <div className="mt-2 flex gap-3 text-xs text-slate-600">
                  <span>{user.transactions} transactions</span>
                  <span>•</span>
                  <span>{user.volume} volume</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {user.status === "active" ? (
                  <Badge className="bg-teal-50 text-teal-700">Active</Badge>
                ) : (
                  <Badge className="bg-red-50 text-red-700">Suspended</Badge>
                )}
                <Button variant="outline" size="sm" onClick={() => toggleUserStatus(user.id)}>
                  {user.status === "active" ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import { LogOut, LayoutDashboard, History, Shield, UserCog } from "lucide-react"

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, show: true },
    { name: "Transactions", href: "/transactions", icon: History, show: true },
    { name: "Admin", href: "/admin", icon: UserCog, show: user?.role === "admin" },
    { name: "Compliance", href: "/compliance", icon: Shield, show: user?.role === "admin" },
  ]

  return (
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">SecureBank</h1>
                <p className="text-xs text-slate-500">International Payments</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navigation
                .filter((item) => item.show)
                .map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Button
                      key={item.name}
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => router.push(item.href)}
                      className={isActive ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : ""}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Button>
                  )
                })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

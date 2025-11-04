"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Home,
  TrendingUp,
  Wallet,
  History,
  Settings,
  LogOut,
} from "lucide-react"

const menuItems = [
  { href: "/dashboard", label: "대시보드", icon: Home },
  { href: "/dashboard/trading", label: "거래", icon: TrendingUp },
  { href: "/dashboard/wallet", label: "내 지갑", icon: Wallet },
  { href: "/dashboard/history", label: "거래 내역", icon: History },
  { href: "/dashboard/settings", label: "설정", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-primary/20 bg-black/50 h-screen sticky top-0 flex flex-col">
      {/* 로고 */}
      <div className="p-6 border-b border-primary/20">
        <h1 className="text-2xl font-bold text-white">cryptoX</h1>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 text-white",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-primary/10"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* 로그아웃 */}
      <div className="p-4 border-t border-primary/20">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-white hover:bg-primary/10"
        >
          <LogOut className="w-5 h-5" />
          로그아웃
        </Button>
      </div>
    </aside>
  )
}



"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, TrendingUp, Wallet, BarChart3, User } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/dashboard", label: "홈", icon: Home },
  { href: "/dashboard/trading", label: "마켓", icon: TrendingUp },
  { href: "/dashboard/wallet", label: "거래", icon: Wallet },
  { href: "/dashboard/history", label: "포지션", icon: BarChart3 },
  { href: "/dashboard/settings", label: "내 정보", icon: User },
]

export function MobileTabs() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 w-full h-14 bg-card border-t border-primary/20 z-30 lg:hidden overscroll-contain"
      aria-label="하단 네비게이션"
    >
      <div className="grid grid-cols-5 h-full">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.href || 
            (tab.href === "/dashboard" && pathname.startsWith("/dashboard") && pathname !== "/dashboard/trading" && pathname !== "/dashboard/wallet" && pathname !== "/dashboard/history" && pathname !== "/dashboard/settings")

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] transition-colors",
                isActive
                  ? "text-primary"
                  : "text-gray-400 hover:text-white"
              )}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

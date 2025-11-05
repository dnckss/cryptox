"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Home,
  TrendingUp,
  Wallet,
  History,
  Settings,
  LogOut,
  Trophy,
  Shield,
  Users,
} from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // 관리자 여부 확인
  useEffect(() => {
    async function checkAdminStatus() {
      try {
        const response = await fetch("/api/user/admin-status")
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setIsAdmin(result.data.isAdmin || false)
          }
        }
      } catch (error) {
        console.error("Failed to check admin status:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [])

  // 일반 사용자 메뉴
  const userMenuItems = [
    { href: "/dashboard", label: "대시보드", icon: Home },
    { href: "/dashboard/trading", label: "거래", icon: TrendingUp },
    { href: "/dashboard/wallet", label: "내 지갑", icon: Wallet },
    { href: "/dashboard/history", label: "거래 내역", icon: History },
    { href: "/dashboard/profit", label: "수익 내역", icon: TrendingUp },
    { href: "/dashboard/ranking", label: "랭킹", icon: Trophy },
    { href: "/dashboard/settings", label: "설정", icon: Settings },
  ]

  // 관리자 메뉴
  const adminMenuItems = [
    { href: "/dashboard/admin/charges", label: "충전 관리", icon: Shield },
    { href: "/dashboard/admin/users", label: "사용자 통계", icon: Users },
  ]

  // 현재 사용자에 맞는 메뉴 선택
  const menuItems = isAdmin ? adminMenuItems : userMenuItems

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("로그아웃 오류:", error)
        alert("로그아웃에 실패했습니다. 다시 시도해주세요.")
      } else {
        // 로그아웃 성공 시 홈 페이지로 리다이렉트
        router.push("/")
        router.refresh()
      }
    } catch (err) {
      console.error("로그아웃 오류:", err)
      alert("로그아웃에 실패했습니다. 다시 시도해주세요.")
    }
  }

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
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-white hover:bg-primary/10"
        >
          <LogOut className="w-5 h-5" />
          로그아웃
        </Button>
      </div>
    </aside>
  )
}



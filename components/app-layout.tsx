"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileDrawer } from "@/components/mobile-drawer"
import { MobileTabs } from "@/components/mobile-tabs"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-black">
      {/* 데스크톱 레이아웃 */}
      <div className="hidden lg:flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto pb-20">
          {children}
        </main>
      </div>

      {/* 모바일 레이아웃 */}
      <div className="lg:hidden flex flex-col min-h-screen">
        {/* 헤더 */}
        <header className="sticky top-0 z-20 bg-black/95 border-b border-primary/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawerOpen(true)}
              className="text-white hover:bg-primary/10 min-w-[44px] min-h-[44px]"
              aria-label="메뉴 열기"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-white">cryptoX</h1>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-y-auto pb-16 overscroll-contain">
          {children}
        </main>

        {/* 하단 탭바 */}
        <MobileTabs />
      </div>

      {/* 모바일 드로어 */}
      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}

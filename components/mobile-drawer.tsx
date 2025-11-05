"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/sidebar"

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      // 스크롤 방지
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  return (
    <>
      {/* 오버레이 */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 드로어 */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-black/95 border-r border-primary/20 z-50 transform transition-transform duration-300 ease-in-out lg:hidden overscroll-contain",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* 닫기 버튼 */}
        <div className="flex items-center justify-between p-4 border-b border-primary/20">
          <h1 className="text-2xl font-bold text-white">cryptoX</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-primary/10 min-w-[44px] min-h-[44px]"
            aria-label="메뉴 닫기"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 사이드바 내용 - 메뉴만 표시 */}
        <div className="h-[calc(100%-73px)] overflow-y-auto overscroll-contain">
          <Sidebar showMenuButton={true} onMenuClick={onClose} />
        </div>
      </div>
    </>
  )
}

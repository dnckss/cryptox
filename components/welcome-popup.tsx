"use client"

import { useState, useEffect } from "react"
import { X, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function WelcomePopup() {
  const [show, setShow] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // 클라이언트 사이드에서만 localStorage 확인
    if (typeof window !== "undefined") {
      // 약간의 지연을 두고 확인 (hydration 문제 방지)
      const timer = setTimeout(async () => {
        try {
          // 현재 사용자 정보 가져오기
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user) {
            // 사용자 ID 기반으로 localStorage 키 생성
            const storageKey = `cryptox_welcome_seen_${user.id}`
            const hasSeenWelcome = localStorage.getItem(storageKey)
            
            if (!hasSeenWelcome) {
              setShow(true)
            }
          }
        } catch (error) {
          console.error("환영 팝업 확인 오류:", error)
          // 에러 시에도 팝업 표시 (안전장치)
          const hasSeenWelcome = localStorage.getItem("cryptox_welcome_seen")
          if (!hasSeenWelcome) {
            setShow(true)
          }
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = async () => {
    setShow(false)
    // localStorage에 표시하지 않겠다는 플래그 저장 (사용자 ID 기반)
    if (typeof window !== "undefined") {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const storageKey = `cryptox_welcome_seen_${user.id}`
          localStorage.setItem(storageKey, "true")
        } else {
          // 사용자 정보가 없으면 기본 키 사용
          localStorage.setItem("cryptox_welcome_seen", "true")
        }
      } catch (error) {
        console.error("환영 팝업 닫기 저장 오류:", error)
        // 에러 시 기본 키 사용
        localStorage.setItem("cryptox_welcome_seen", "true")
      }
    }
  }

  // 클라이언트 사이드에서만 렌더링
  if (!mounted || !show) return null

  return (
    <>
      {/* 배경 오버레이 (opacity 적용) */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* 팝업 */}
        <Card className="bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30 backdrop-blur-md max-w-md w-full relative">
          <CardContent className="p-8">
            {/* 닫기 버튼 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="absolute top-4 right-4 text-white hover:bg-primary/20 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>

            {/* 내용 */}
            <div className="text-center space-y-6">
              {/* 아이콘 */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
              </div>

              {/* 제목 */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  cryptoX에 오신 것을 환영합니다!
                </h2>
              </div>

              {/* 메시지 */}
              <div className="bg-black/40 rounded-lg p-6 border border-primary/20">
                <p className="text-white text-lg font-semibold mb-2">
                  초기 투자 자본금
                </p>
                <p className="text-3xl font-bold text-primary mb-2">
                  ₩50,000,000
                </p>
                
              </div>

              {/* 설명 */}
              <p className="text-gray-400 text-sm leading-relaxed">
                이제 cryptoX에서 다양한 코인을 거래하고
                <br />
                투자 포트폴리오를 만들어보세요!
              </p>

              {/* 확인 버튼 */}
              <Button
                onClick={handleClose}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-4"
              >
                시작하기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}


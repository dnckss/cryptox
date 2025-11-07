"use client"

import { useState, useEffect } from "react"
import { X, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface Announcement {
  id: string
  title: string
  content: string
  created_at: string
}

export function AnnouncementNotification() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState<string[]>([]) // 이미 본 공지 ID 목록
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  const handleDismiss = (announcementId: string) => {
    setVisible(false)
    
    // sessionStorage에 추가하여 다시 표시하지 않음
    const dismissedIds = JSON.parse(
      sessionStorage.getItem("dismissedAnnouncements") || "[]"
    )
    if (!dismissedIds.includes(announcementId)) {
      dismissedIds.push(announcementId)
      sessionStorage.setItem("dismissedAnnouncements", JSON.stringify(dismissedIds))
    }
    
    // 0.3초 후 완전히 제거 (애니메이션용)
    setTimeout(() => {
      setAnnouncement(null)
    }, 300)
  }

  // 관리자 여부 확인 및 최신 공지 조회 (주기적으로 확인)
  useEffect(() => {
    let isMounted = true
    let dismissTimeout: NodeJS.Timeout | null = null
    let lastAnnouncementId: string | null = null

    async function checkAdminAndFetchAnnouncement() {
      try {
        // 관리자 여부 확인
        const adminResponse = await fetch("/api/user/admin-status")
        if (adminResponse.ok) {
          const adminResult = await adminResponse.json()
          if (adminResult.success) {
            const adminStatus = adminResult.data.isAdmin || false
            if (isMounted) {
              setIsAdmin(adminStatus)
            }
            
            // 어드민이면 알림 표시하지 않음
            if (adminStatus) {
              return
            }
          }
        }

        // 사용자면 최신 공지 조회
        const response = await fetch("/api/announcements/latest")
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data && isMounted) {
            const latestAnnouncement = result.data
            
            // 새로운 공지인지 확인 (이전에 본 공지와 다른 ID인 경우)
            if (lastAnnouncementId !== latestAnnouncement.id) {
              lastAnnouncementId = latestAnnouncement.id
              
              // 이미 본 공지인지 확인
              const dismissedIds = JSON.parse(
                sessionStorage.getItem("dismissedAnnouncements") || "[]"
              )
              
              if (!dismissedIds.includes(latestAnnouncement.id)) {
                setAnnouncement(latestAnnouncement)
                setVisible(true)
                
                // 이전 타이머 취소
                if (dismissTimeout) {
                  clearTimeout(dismissTimeout)
                }
                
                // 5초 후 자동으로 사라짐
                dismissTimeout = setTimeout(() => {
                  if (isMounted) {
                    handleDismiss(latestAnnouncement.id)
                  }
                }, 5000)
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to check admin status or fetch announcement:", error)
      }
    }

    // 초기 확인
    checkAdminAndFetchAnnouncement()

    // 3초마다 최신 공지 확인 (새 공지 자동 감지)
    const interval = setInterval(() => {
      if (isMounted) {
        checkAdminAndFetchAnnouncement()
      }
    }, 3000)

    // 새 공지 이벤트 리스너 (같은 탭에서 어드민이 공지를 작성했을 때)
    const handleNewAnnouncement = (event: CustomEvent) => {
      // 어드민이면 알림 표시하지 않음
      if (isAdmin) {
        return
      }

      const newAnnouncement = event.detail
      if (isMounted) {
        lastAnnouncementId = newAnnouncement.id
        setAnnouncement(newAnnouncement)
        setVisible(true)
        
        // 이전 타이머 취소
        if (dismissTimeout) {
          clearTimeout(dismissTimeout)
        }
        
        // 5초 후 자동으로 사라짐
        dismissTimeout = setTimeout(() => {
          if (isMounted) {
            handleDismiss(newAnnouncement.id)
          }
        }, 5000)
      }
    }

    window.addEventListener("newAnnouncement", handleNewAnnouncement as EventListener)

    return () => {
      isMounted = false
      clearInterval(interval)
      if (dismissTimeout) {
        clearTimeout(dismissTimeout)
      }
      window.removeEventListener("newAnnouncement", handleNewAnnouncement as EventListener)
    }
  }, [isAdmin])

  const handleClick = () => {
    if (announcement) {
      handleDismiss(announcement.id)
      router.push("/dashboard/announcements")
    }
  }

  // 어드민이면 알림 표시하지 않음
  if (isAdmin || !announcement || !visible) {
    return null
  }

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      <div className="bg-primary/90 backdrop-blur-sm border border-primary/50 rounded-lg shadow-lg p-4 mx-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white mb-1 line-clamp-1">
              {announcement.title}
            </h3>
            <p className="text-xs text-white/80 line-clamp-2 mb-2">
              {announcement.content}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClick}
              className="text-xs text-white hover:text-white/80 hover:bg-black/40 h-6 px-2"
            >
              자세히 보기
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDismiss(announcement.id)}
            className="flex-shrink-0 text-white hover:text-white/80 hover:bg-black/40 h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}


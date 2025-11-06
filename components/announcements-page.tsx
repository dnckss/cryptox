"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Calendar, Trash2 } from "lucide-react"
// 날짜 포맷팅 함수 (date-fns 없이)
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}.${month}.${day} ${hours}:${minutes}`
}

interface Announcement {
  id: string
  title: string
  content: string
  author_id: string
  view_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
      }
    }

    checkAdminStatus()
  }, [])

  // 공지 목록 조회
  useEffect(() => {
    async function fetchAnnouncements(silent: boolean = false) {
      try {
        if (!silent) {
          setLoading(true)
        }
        const response = await fetch("/api/announcements")
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setAnnouncements(result.data || [])
          }
        }
      } catch (error) {
        console.error("Failed to load announcements:", error)
      } finally {
        if (!silent) {
          setLoading(false)
        }
      }
    }

    // 초기 로드
    fetchAnnouncements(false)

    // 어드민이 아니면 3초마다 공지 목록 갱신 (삭제된 공지 자동 반영)
    // 어드민은 직접 삭제할 수 있으므로 자동 갱신 불필요
    let interval: NodeJS.Timeout | null = null
    
    if (!isAdmin) {
      interval = setInterval(() => {
        fetchAnnouncements(true)
      }, 3000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isAdmin])

  // 공지 삭제
  const handleDelete = async (announcementId: string) => {
    if (!confirm("이 공지를 삭제하시겠습니까?")) {
      return
    }

    try {
      setDeletingId(announcementId)
      const response = await fetch(`/api/announcements/${announcementId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // 목록에서 제거
          setAnnouncements((prev) =>
            prev.filter((ann) => ann.id !== announcementId)
          )
          alert("공지가 삭제되었습니다.")
        } else {
          alert("공지 삭제에 실패했습니다.")
        }
      } else {
        const error = await response.json()
        alert(error.error || "공지 삭제에 실패했습니다.")
      }
    } catch (error) {
      console.error("Failed to delete announcement:", error)
      alert("공지 삭제에 실패했습니다.")
    } finally {
      setDeletingId(null)
    }
  }

  // 공지 작성
  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      alert("제목과 내용을 입력해주세요.")
      return
    }

    try {
      setCreating(true)
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // 새 공지를 목록 맨 위에 추가
          setAnnouncements((prev) => [result.data, ...prev])
          setNewTitle("")
          setNewContent("")
          setCreateDialogOpen(false)
          
          // 새 공지 알림 이벤트 발생
          window.dispatchEvent(new CustomEvent("newAnnouncement", {
            detail: result.data
          }))
        }
      } else {
        const error = await response.json()
        alert(error.error || "공지 작성에 실패했습니다.")
      }
    } catch (error) {
      console.error("Failed to create announcement:", error)
      alert("공지 작성에 실패했습니다.")
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="rounded-2xl border border-primary/20 bg-black/40 p-8">
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">공지사항</h1>
        {isAdmin && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                공지 작성
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-black border-primary/20 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl">새 공지 작성</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">제목</label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="공지 제목을 입력하세요"
                    className="bg-black/40 border-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">내용</label>
                  <Textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="공지 내용을 입력하세요"
                    rows={10}
                    className="bg-black/40 border-primary/20"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCreateDialogOpen(false)
                      setNewTitle("")
                      setNewContent("")
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={creating || !newTitle.trim() || !newContent.trim()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {creating ? "작성 중..." : "작성"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {announcements.length === 0 ? (
        <Card className="bg-black/40 border-primary/20">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400">등록된 공지가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card
              key={announcement.id}
              className="bg-black/40 border-primary/20 hover:border-primary/40 transition-colors"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl text-white">
                    {announcement.title}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDate(announcement.created_at)}
                      </span>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(announcement.id)}
                        disabled={deletingId === announcement.id}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                      >
                        {deletingId === announcement.id ? (
                          <span className="text-xs">삭제 중...</span>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-gray-300 whitespace-pre-wrap">
                  {announcement.content}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}


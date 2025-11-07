"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Calendar, MessageSquare } from "lucide-react"

// 날짜 포맷팅 함수
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}.${month}.${day} ${hours}:${minutes}`
}

interface Inquiry {
  id: string
  user_id: string
  title: string
  content: string
  status: "pending" | "answered" | "closed"
  admin_response: string | null
  admin_id: string | null
  answered_at: string | null
  created_at: string
  updated_at: string
  userNickname?: string | null
}

export function InquiryPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [creating, setCreating] = useState(false)

  // 문의 목록 조회
  useEffect(() => {
    async function fetchInquiries() {
      try {
        setLoading(true)
        const response = await fetch("/api/inquiries")
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setInquiries(result.data || [])
          }
        }
      } catch (error) {
        console.error("Failed to load inquiries:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInquiries()
  }, [])

  // 문의 작성
  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      alert("제목과 내용을 입력해주세요.")
      return
    }

    try {
      setCreating(true)
      const response = await fetch("/api/inquiries", {
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
          // 새 문의를 목록 맨 위에 추가
          setInquiries((prev) => [result.data, ...prev])
          setNewTitle("")
          setNewContent("")
          setCreateDialogOpen(false)
          alert("문의가 등록되었습니다.")
        }
      } else {
        const error = await response.json()
        alert(error.error || "문의 작성에 실패했습니다.")
      }
    } catch (error) {
      console.error("Failed to create inquiry:", error)
      alert("문의 작성에 실패했습니다.")
    } finally {
      setCreating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-400"
      case "answered":
        return "text-green-400"
      case "closed":
        return "text-gray-400"
      default:
        return "text-gray-400"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "대기 중"
      case "answered":
        return "답변 완료"
      case "closed":
        return "종료"
      default:
        return status
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
        <h1 className="text-3xl font-bold text-white">문의하기</h1>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              문의 작성
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black border-primary/20 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">새 문의 작성</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">제목</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="문의 제목을 입력하세요"
                  className="bg-black/40 border-primary/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">내용</label>
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="문의 내용을 입력하세요"
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
      </div>

      {inquiries.length === 0 ? (
        <Card className="bg-black/40 border-primary/20">
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">등록된 문의가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <Card
              key={inquiry.id}
              className="bg-black/40 border-primary/20 hover:border-primary/40 transition-colors"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl text-white mb-2">
                      {inquiry.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className={getStatusColor(inquiry.status)}>
                        {getStatusText(inquiry.status)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(inquiry.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">문의 내용</p>
                    <div className="text-gray-300 whitespace-pre-wrap bg-black/20 p-4 rounded-lg">
                      {inquiry.content}
                    </div>
                  </div>
                  {inquiry.admin_response && (
                    <div>
                      <p className="text-sm text-green-400 mb-2">운영자 답변</p>
                      <div className="text-gray-300 whitespace-pre-wrap bg-primary/10 border border-primary/20 p-4 rounded-lg">
                        {inquiry.admin_response}
                      </div>
                      {inquiry.answered_at && (
                        <p className="text-xs text-gray-500 mt-2">
                          답변일: {formatDate(inquiry.answered_at)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}


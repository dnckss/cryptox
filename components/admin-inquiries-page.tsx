"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar, MessageSquare, User, CheckCircle } from "lucide-react"

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

export function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [responseDialogOpen, setResponseDialogOpen] = useState(false)
  const [response, setResponse] = useState("")
  const [responding, setResponding] = useState(false)
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "answered" | "closed">("all")

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

  // 문의 답변
  const handleRespond = async () => {
    if (!selectedInquiry || !response.trim()) {
      alert("답변 내용을 입력해주세요.")
      return
    }

    try {
      setResponding(true)
      const responseData = await fetch(`/api/inquiries/${selectedInquiry.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          admin_response: response.trim(),
          status: "answered",
        }),
      })

      if (responseData.ok) {
        const result = await responseData.json()
        if (result.success) {
          // 목록 업데이트
          setInquiries((prev) =>
            prev.map((inq) =>
              inq.id === selectedInquiry.id ? result.data : inq
            )
          )
          setResponse("")
          setResponseDialogOpen(false)
          setSelectedInquiry(null)
          alert("답변이 등록되었습니다.")
        }
      } else {
        const error = await responseData.json()
        alert(error.error || "답변 등록에 실패했습니다.")
      }
    } catch (error) {
      console.error("Failed to respond to inquiry:", error)
      alert("답변 등록에 실패했습니다.")
    } finally {
      setResponding(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
      case "answered":
        return "text-green-400 bg-green-400/10 border-green-400/20"
      case "closed":
        return "text-gray-400 bg-gray-400/10 border-gray-400/20"
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20"
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

  const getUserDisplay = (inquiry: Inquiry) => {
    const baseId =
      inquiry.user_id && inquiry.user_id.length > 8
        ? `${inquiry.user_id.slice(0, 8)}...`
        : inquiry.user_id

    if (inquiry.userNickname && inquiry.userNickname.trim().length > 0) {
      return `${inquiry.userNickname} (${baseId})`
    }

    return `ID: ${baseId}`
  }

  // 필터링된 문의 목록
  const filteredInquiries =
    filterStatus === "all"
      ? inquiries
      : inquiries.filter((inq) => inq.status === filterStatus)

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
        <h1 className="text-3xl font-bold text-white">문의 관리</h1>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
          >
            전체
          </Button>
          <Button
            variant={filterStatus === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("pending")}
          >
            대기 중
          </Button>
          <Button
            variant={filterStatus === "answered" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("answered")}
          >
            답변 완료
          </Button>
        </div>
      </div>

      {filteredInquiries.length === 0 ? (
        <Card className="bg-black/40 border-primary/20">
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">등록된 문의가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((inquiry) => (
            <Card
              key={inquiry.id}
              className="bg-black/40 border-primary/20 hover:border-primary/40 transition-colors"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl text-white">
                        {inquiry.title}
                      </CardTitle>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                          inquiry.status
                        )}`}
                      >
                        {getStatusText(inquiry.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>사용자: {getUserDisplay(inquiry)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(inquiry.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  {inquiry.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedInquiry(inquiry)
                        setResponse("")
                        setResponseDialogOpen(true)
                      }}
                      className="bg-primary hover:bg-primary/90"
                    >
                      답변하기
                    </Button>
                  )}
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
                      <p className="text-sm text-green-400 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        운영자 답변
                      </p>
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

      {/* 답변 다이얼로그 */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="bg-black border-primary/20 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">문의 답변</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4 mt-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">문의 제목</p>
                <p className="text-white">{selectedInquiry.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">문의 내용</p>
                <div className="text-gray-300 whitespace-pre-wrap bg-black/20 p-4 rounded-lg">
                  {selectedInquiry.content}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">답변 내용</label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="답변 내용을 입력하세요"
                  rows={8}
                  className="bg-black/40 border-primary/20"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setResponseDialogOpen(false)
                    setResponse("")
                    setSelectedInquiry(null)
                  }}
                >
                  취소
                </Button>
                <Button
                  onClick={handleRespond}
                  disabled={responding || !response.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  {responding ? "등록 중..." : "답변 등록"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


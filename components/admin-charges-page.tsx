"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Clock, Search, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChargeRequest {
  id: string
  userId: string
  userName: string
  virtualAmount: number
  realPrice: number
  packageId: string
  status: "pending" | "approved" | "rejected"
  accountInfo: string
  adminNote: string
  createdAt: string
}

export function AdminChargesPage() {
  const [loading, setLoading] = useState(true)
  const [charges, setCharges] = useState<ChargeRequest[]>([])
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("pending")
  const [searchTerm, setSearchTerm] = useState("")
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  useEffect(() => {
    fetchCharges()
    
    // 5초마다 자동 새로고침
    const interval = setInterval(fetchCharges, 5000)
    return () => clearInterval(interval)
  }, [filterStatus])

  async function fetchCharges() {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/charges?status=${filterStatus}`)
      if (!response.ok) {
        throw new Error("Failed to fetch charges")
      }
      const result = await response.json()
      if (result.success) {
        setCharges(result.data || [])
      }
    } catch (error) {
      console.error("Failed to load charges:", error)
      setCharges([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    if (!confirm("이 충전 신청을 승인하시겠습니까?")) {
      return
    }

    setProcessingId(id)
    try {
      const response = await fetch(`/api/admin/charges/${id}/approve`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to approve")
      }

      const result = await response.json()
      if (result.success) {
        alert("충전이 승인되었습니다.")
        fetchCharges()
      }
    } catch (error) {
      console.error("Failed to approve:", error)
      alert("승인에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: string) => {
    if (!rejectNote.trim()) {
      alert("거절 사유를 입력해주세요.")
      return
    }

    if (!confirm("이 충전 신청을 거절하시겠습니까?")) {
      return
    }

    setProcessingId(id)
    try {
      const response = await fetch(`/api/admin/charges/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note: rejectNote.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to reject")
      }

      const result = await response.json()
      if (result.success) {
        alert("충전이 거절되었습니다.")
        setRejectNote("")
        setRejectingId(null)
        fetchCharges()
      }
    } catch (error) {
      console.error("Failed to reject:", error)
      alert("거절에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-400" />
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "승인 대기"
      case "approved":
        return "승인됨"
      case "rejected":
        return "거절됨"
      default:
        return status
    }
  }

  const filteredCharges = charges.filter((charge) => {
    if (!searchTerm) return true
    return (
      charge.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      charge.accountInfo.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  if (loading && charges.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl border border-primary/20 bg-black/40 p-8">
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">충전 관리</h1>
        <p className="text-gray-400">충전 신청을 승인/거절하세요</p>
      </div>

      {/* 필터 및 검색 */}
      <Card className="bg-transparent border-primary/20">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 상태 필터 */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <div className="flex gap-2">
                {(["all", "pending", "approved", "rejected"] as const).map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
                    className={cn(
                      filterStatus === status
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent border-primary/30 text-white hover:bg-primary/10"
                    )}
                  >
                    {status === "all" ? "전체" : getStatusLabel(status)}
                  </Button>
                ))}
              </div>
            </div>

            {/* 검색 */}
            <div className="flex-1 flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="사용자명 또는 입금자명 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-primary/20 text-white placeholder:text-gray-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 충전 신청 목록 */}
      {filteredCharges.length === 0 ? (
        <Card className="bg-transparent border-primary/20">
          <CardContent className="p-12 text-center">
            <p className="text-gray-400">충전 신청이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCharges.map((charge) => (
            <Card
              key={charge.id}
              className={cn(
                "bg-transparent border-primary/20",
                charge.status === "pending" && "border-yellow-400/30"
              )}
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* 정보 */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(charge.status)}
                      <span
                        className={cn(
                          "text-sm font-medium",
                          charge.status === "pending" && "text-yellow-400",
                          charge.status === "approved" && "text-green-400",
                          charge.status === "rejected" && "text-red-400"
                        )}
                      >
                        {getStatusLabel(charge.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400 mb-1">사용자</p>
                        <p className="text-white font-medium">{charge.userName}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">충전 금액</p>
                        <p className="text-white font-medium">
                          ₩{(charge.virtualAmount / 10_000).toLocaleString()}만
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">입금 금액</p>
                        <p className="text-white font-medium">
                          ₩{charge.realPrice.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">입금자명</p>
                        <p className="text-white font-medium">{charge.accountInfo || "-"}</p>
                      </div>
                    </div>

                    <div className="text-sm">
                      <p className="text-gray-400 mb-1">신청 시간</p>
                      <p className="text-gray-300">
                        {new Date(charge.createdAt).toLocaleString("ko-KR")}
                      </p>
                    </div>

                    {charge.adminNote && (
                      <div className="text-sm">
                        <p className="text-gray-400 mb-1">관리자 메모</p>
                        <p className="text-red-300">{charge.adminNote}</p>
                      </div>
                    )}

                    {/* 거절 사유 입력 (거절 버튼 클릭 시) */}
                    {rejectingId === charge.id && (
                      <div className="space-y-2 mt-4">
                        <Label className="text-white">거절 사유</Label>
                        <Input
                          type="text"
                          placeholder="거절 사유를 입력하세요"
                          value={rejectNote}
                          onChange={(e) => setRejectNote(e.target.value)}
                          className="bg-transparent border-primary/20 text-white placeholder:text-gray-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  {charge.status === "pending" && (
                    <div className="flex gap-2">
                      {rejectingId === charge.id ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRejectingId(null)
                              setRejectNote("")
                            }}
                            className="bg-transparent border-primary/30 text-white hover:bg-primary/10"
                          >
                            취소
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleReject(charge.id)}
                            disabled={processingId === charge.id || !rejectNote.trim()}
                            className="bg-red-500 text-white hover:bg-red-600"
                          >
                            {processingId === charge.id ? "처리 중..." : "거절 확인"}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(charge.id)}
                            disabled={processingId === charge.id}
                            className="bg-green-500 text-white hover:bg-green-600"
                          >
                            {processingId === charge.id ? "처리 중..." : "승인"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRejectingId(charge.id)}
                            disabled={processingId === charge.id}
                            className="bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            거절
                          </Button>
                        </>
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


"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUp, ArrowDown, Search, Filter, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Transaction {
  id: string
  coinId: string
  coinName: string
  coinSymbol: string
  type: "buy" | "sell"
  amount: number
  price: number
  totalValue: number
  averageBuyPrice: number | null // 판매 시 평균 매수가 (구매 시 null)
  createdAt: string
}

export function HistoryPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "buy" | "sell">("all")

  // 거래 내역 로드
  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true)
        const response = await fetch("/api/user/transactions?limit=100")
        if (!response.ok) {
          throw new Error("Failed to fetch transactions")
        }
        const result = await response.json()
        if (result.success) {
          setTransactions(result.data)
          setFilteredTransactions(result.data)
        }
      } catch (error) {
        console.error("Failed to load transactions:", error)
        setTransactions([])
        setFilteredTransactions([])
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  // 검색 및 필터링
  useEffect(() => {
    let filtered = transactions

    // 타입 필터
    if (filterType !== "all") {
      filtered = filtered.filter((tx) => tx.type === filterType)
    }

    // 검색어 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (tx) =>
          tx.coinName.toLowerCase().includes(query) ||
          tx.coinSymbol.toLowerCase().includes(query) ||
          tx.coinId.toLowerCase().includes(query)
      )
    }

    setFilteredTransactions(filtered)
  }, [transactions, searchQuery, filterType])

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "방금 전"
    if (diffMins < 60) return `${diffMins}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`

    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 헤더 */}
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
          거래 내역
        </h1>
        <p className="text-sm sm:text-base text-gray-400">
          모든 구매 및 판매 기록을 확인하세요
        </p>
      </header>

      {/* 검색 및 필터 */}
      <Card className="bg-transparent border-primary/20">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-4">
              {/* 검색 */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="코인 이름 또는 심볼로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/40 border-primary/20 text-white"
                />
              </div>

              {/* 타입 필터 */}
              <div className="flex gap-2 md:self-start">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("all")}
                  className={cn(
                    filterType === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent border-primary/20 text-white hover:bg-primary/10"
                  )}
                >
                  전체
                </Button>
                <Button
                  variant={filterType === "buy" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("buy")}
                  className={cn(
                    filterType === "buy"
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent border-primary/20 text-white hover:bg-primary/10"
                  )}
                >
                  구매
                </Button>
                <Button
                  variant={filterType === "sell" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("sell")}
                  className={cn(
                    filterType === "sell"
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent border-primary/20 text-white hover:bg-primary/10"
                  )}
                >
                  판매
                </Button>
              </div>
            </div>
          </CardContent>
      </Card>

      {/* 거래 내역 리스트 */}
      <Card className="bg-transparent border-primary/20">
        <CardHeader className="px-4 sm:px-6 pb-2 sm:pb-4">
          <CardTitle className="text-white text-lg sm:text-xl">
            거래 내역 ({filteredTransactions.length}건)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6 pb-6">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-gray-400 mb-4">거래 내역이 없습니다</p>
              <Button
                onClick={() => router.push("/dashboard/trading")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                거래하기
              </Button>
            </div>
          ) : (
            <>
              {/* 데스크톱 테이블 */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-primary/20">
                      <th className="text-left p-4 text-gray-400 font-medium text-sm">날짜</th>
                      <th className="text-left p-4 text-gray-400 font-medium text-sm">타입</th>
                      <th className="text-left p-4 text-gray-400 font-medium text-sm">코인</th>
                      <th className="text-right p-4 text-gray-400 font-medium text-sm">수량</th>
                      <th className="text-right p-4 text-gray-400 font-medium text-sm">가격</th>
                      <th className="text-right p-4 text-gray-400 font-medium text-sm">총액</th>
                      <th className="text-center p-4 text-gray-400 font-medium text-sm">상세</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => {
                      const isBuy = tx.type === "buy"
                      return (
                        <tr
                          key={tx.id}
                          className="border-b border-primary/10 hover:bg-primary/5 transition-colors"
                        >
                          <td className="p-4 text-gray-400 text-sm">
                            {formatDate(tx.createdAt)}
                          </td>
                          <td className="p-4">
                            <div
                              className={cn(
                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium",
                                isBuy
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              )}
                            >
                              {isBuy ? (
                                <ArrowUp className="w-3 h-3" />
                              ) : (
                                <ArrowDown className="w-3 h-3" />
                              )}
                              {isBuy ? "구매" : "판매"}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
                                <span className="text-xs font-bold text-primary">
                                  {tx.coinSymbol[0]}
                                </span>
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">{tx.coinName}</p>
                                <p className="text-gray-400 text-xs">{tx.coinSymbol}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right text-white font-medium">
                            {tx.amount < 1
                              ? tx.amount.toFixed(8).replace(/\.?0+$/, "")
                              : tx.amount.toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })}
                          </td>
                          <td className="p-4 text-right text-gray-300">
                            {tx.price < 1
                              ? `₩${tx.price.toFixed(8).replace(/\.?0+$/, "")}`
                              : tx.price < 1000
                              ? `₩${tx.price.toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                })}`
                              : `₩${tx.price.toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })}`}
                          </td>
                          <td className="p-4 text-right text-white font-semibold">
                            ₩{tx.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          <td className="p-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(`/dashboard/coin/${tx.coinSymbol.toLowerCase()}`)
                              }
                              className="text-primary hover:text-primary/80 hover:bg-primary/10"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* 모바일 카드 */}
              <div className="lg:hidden divide-y divide-primary/10">
                {filteredTransactions.map((tx) => {
                  const isBuy = tx.type === "buy"
                  return (
                    <div key={tx.id} className="px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
                            <span className="text-xs font-bold text-primary">
                              {tx.coinSymbol[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{tx.coinName}</p>
                            <p className="text-gray-500 text-xs">{formatDate(tx.createdAt)}</p>
                          </div>
                        </div>
                        <div
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                            isBuy ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                          )}
                        >
                          {isBuy ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                          {isBuy ? "구매" : "판매"}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div className="text-gray-400">
                          <p className="text-xs">수량</p>
                          <p className="text-white font-medium">
                            {tx.amount < 1
                              ? tx.amount.toFixed(6).replace(/\.?0+$/, "")
                              : tx.amount.toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })}
                          </p>
                        </div>
                        <div className="text-gray-400 text-right">
                          <p className="text-xs">가격</p>
                          <p className="text-white font-medium">
                            {tx.price < 1
                              ? `₩${tx.price.toFixed(6).replace(/\.?0+$/, "")}`
                              : `₩${tx.price.toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })}`}
                          </p>
                        </div>
                        <div className="col-span-2 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-400">총액</p>
                            <p className="text-lg font-semibold text-white">
                              ₩{tx.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/dashboard/coin/${tx.coinSymbol.toLowerCase()}`)
                            }
                            className="text-primary hover:text-primary/80 hover:bg-primary/10"
                          >
                            상세보기
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


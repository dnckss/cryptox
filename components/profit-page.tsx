"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUp, ArrowDown, Search, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface Transaction {
  id: string
  coinId: string
  coinName: string
  coinSymbol: string
  type: "buy" | "sell"
  amount: number
  price: number // 단위당 가격
  totalValue: number // 전체 거래 금액
  averageBuyPrice: number | null // 단위당 평균 매수가
  createdAt: string
}

interface ProfitRecord {
  id: string
  coinName: string
  coinSymbol: string
  amount: number
  sellPrice: number
  buyPrice: number
  profit: number
  profitPercent: number
  createdAt: string
}

export function ProfitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profitRecords, setProfitRecords] = useState<ProfitRecord[]>([])
  const [filteredProfitRecords, setFilteredProfitRecords] = useState<ProfitRecord[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // 거래 내역 로드 및 수익 계산
  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true)
        const response = await fetch("/api/user/transactions?limit=1000")
        if (!response.ok) {
          throw new Error("Failed to fetch transactions")
        }
        const result = await response.json()
        if (result.success) {
          // 판매 거래만 필터링하여 수익 내역 생성
          const profits = result.data
            .filter((tx: Transaction) => tx.type === "sell" && tx.averageBuyPrice !== null && tx.averageBuyPrice !== undefined)
            .map((tx: Transaction) => {
              // 사용자가 요청한 계산 방식:
              // 1. 단위당 매입가 = 전체 매입 금액 ÷ 수량
              // 2. 단위당 매도가 = 전체 매도 금액 ÷ 수량
              // 3. 단위당 이익 = 단위당 매도가 - 단위당 매입가
              // 4. 총 수익 = 단위당 이익 × 수량
              
              // 전체 매입 금액 = 단위당 평균 매수가 × 수량
              const buyTotal = tx.averageBuyPrice! * tx.amount
              
              // 전체 매도 금액 = 판매 총액 (totalValue)
              const sellTotal = tx.totalValue
              
              // 단위당 매입가 = 전체 매입 금액 ÷ 수량
              const unitBuyPrice = tx.amount > 0 ? buyTotal / tx.amount : 0
              
              // 단위당 매도가 = 전체 매도 금액 ÷ 수량
              const unitSellPrice = tx.amount > 0 ? sellTotal / tx.amount : 0
              
              // 단위당 이익 = 단위당 매도가 - 단위당 매입가
              const unitProfit = unitSellPrice - unitBuyPrice
              
              // 총 수익 = 단위당 이익 × 수량
              const profit = unitProfit * tx.amount
              
              // 수익률 계산 (구매 원금 기준)
              const profitPercent = buyTotal > 0 ? (profit / buyTotal) * 100 : 0
              
              // 디버깅: 수익 계산 확인
              console.log("💰 수익 계산:", {
                coin: tx.coinSymbol,
                amount: tx.amount,
                averageBuyPrice: tx.averageBuyPrice,
                price: tx.price,
                totalValue: tx.totalValue,
                buyTotal,
                sellTotal,
                unitBuyPrice,
                unitSellPrice,
                unitProfit,
                profit,
                profitPercent,
              })
              
              return {
                id: tx.id,
                coinName: tx.coinName,
                coinSymbol: tx.coinSymbol,
                amount: tx.amount,
                sellPrice: unitSellPrice, // 단위당 판매가 (전체 판매 금액 ÷ 수량)
                buyPrice: unitBuyPrice, // 단위당 매입가 (전체 매입 금액 ÷ 수량)
                profit: profit, // 총 수익 (단위당 이익 × 수량)
                profitPercent: profitPercent,
                createdAt: tx.createdAt,
              }
            })
            .sort((a: ProfitRecord, b: ProfitRecord) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // 최신순 정렬
          
          setProfitRecords(profits)
          setFilteredProfitRecords(profits)
        }
      } catch (error) {
        console.error("Failed to load transactions:", error)
        setProfitRecords([])
        setFilteredProfitRecords([])
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  // 검색 필터링
  useEffect(() => {
    let filtered = profitRecords

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (record) =>
          record.coinName.toLowerCase().includes(query) ||
          record.coinSymbol.toLowerCase().includes(query)
      )
    }

    setFilteredProfitRecords(filtered)
  }, [profitRecords, searchQuery])

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

  // 총 수익 계산
  const totalProfit = profitRecords.reduce((sum, record) => sum + record.profit, 0)
  const totalProfitPercent = profitRecords.length > 0
    ? profitRecords.reduce((sum, record) => sum + record.profitPercent, 0) / profitRecords.length
    : 0

  if (loading) {
    return (
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400">로딩 중...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">수익 내역</h1>
          <p className="text-gray-400">판매한 코인의 수익 내역을 확인하세요</p>
        </div>

        {/* 총 수익 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                총 수익
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-4xl font-bold mb-2",
                  totalProfit >= 0 ? "text-green-400" : "text-red-400"
                )}
              >
                {totalProfit >= 0 ? "+" : ""}₩{Math.round(totalProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-gray-400">
                {profitRecords.length}건의 판매 거래
              </p>
            </CardContent>
          </Card>

          <Card className="bg-transparent border-primary/20">
            <CardHeader>
              <CardTitle className="text-white text-sm">평균 수익률</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-3xl font-bold",
                  totalProfitPercent >= 0 ? "text-green-400" : "text-red-400"
                )}
              >
                {totalProfitPercent >= 0 ? "+" : ""}{totalProfitPercent.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-transparent border-primary/20">
            <CardHeader>
              <CardTitle className="text-white text-sm">판매 거래 수</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{profitRecords.length}</p>
              <p className="text-sm text-gray-400 mt-1">건</p>
            </CardContent>
          </Card>
        </div>

        {/* 검색 */}
        <Card className="bg-transparent border-primary/20 mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="코인 이름 또는 심볼로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black/40 border-primary/20 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* 수익 내역 리스트 */}
        <Card className="bg-transparent border-primary/20">
          <CardHeader>
            <CardTitle className="text-white">
              수익 내역 ({filteredProfitRecords.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProfitRecords.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">판매 거래 내역이 없습니다</p>
                <p className="text-gray-500 text-sm mb-4">
                  코인을 판매하면 수익 내역이 표시됩니다
                </p>
                <Button
                  onClick={() => router.push("/dashboard/trading")}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  거래하기
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-primary/20">
                      <th className="text-left p-4 text-gray-400 font-medium text-sm">날짜</th>
                      <th className="text-left p-4 text-gray-400 font-medium text-sm">코인</th>
                      <th className="text-right p-4 text-gray-400 font-medium text-sm">판매 수량</th>
                      <th className="text-right p-4 text-gray-400 font-medium text-sm">매수가</th>
                      <th className="text-right p-4 text-gray-400 font-medium text-sm">판매가</th>
                      <th className="text-right p-4 text-gray-400 font-medium text-sm">수익</th>
                      <th className="text-right p-4 text-gray-400 font-medium text-sm">수익률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfitRecords.map((record) => {
                      const isPositive = record.profit >= 0
                      return (
                        <tr
                          key={record.id}
                          className="border-b border-primary/10 hover:bg-primary/5 transition-colors"
                        >
                          <td className="p-4 text-gray-400 text-sm">
                            {formatDate(record.createdAt)}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
                                <span className="text-xs font-bold text-primary">
                                  {record.coinSymbol[0]}
                                </span>
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">{record.coinName}</p>
                                <p className="text-gray-400 text-xs">{record.coinSymbol}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right text-white font-medium">
                            {record.amount < 1
                              ? record.amount.toFixed(8).replace(/\.?0+$/, "")
                              : record.amount.toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })}
                          </td>
                          <td className="p-4 text-right text-gray-300">
                            {record.buyPrice < 1
                              ? `₩${record.buyPrice.toFixed(8).replace(/\.?0+$/, "")}`
                              : record.buyPrice < 1000
                              ? `₩${record.buyPrice.toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                })}`
                              : `₩${record.buyPrice.toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })}`}
                          </td>
                          <td className="p-4 text-right text-gray-300">
                            {record.sellPrice < 1
                              ? `₩${record.sellPrice.toFixed(8).replace(/\.?0+$/, "")}`
                              : record.sellPrice < 1000
                              ? `₩${record.sellPrice.toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                })}`
                              : `₩${record.sellPrice.toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })}`}
                          </td>
                          <td className="p-4 text-right">
                            <div
                              className={cn(
                                "flex items-center justify-end gap-1.5",
                                isPositive ? "text-green-400" : "text-red-400"
                              )}
                            >
                              {isPositive ? (
                                <ArrowUp className="w-4 h-4" />
                              ) : (
                                <ArrowDown className="w-4 h-4" />
                              )}
                              <span className="font-semibold">
                                {isPositive ? "+" : ""}₩{Math.round(record.profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <span
                              className={cn(
                                "font-medium",
                                isPositive ? "text-green-400" : "text-red-400"
                              )}
                            >
                              {isPositive ? "+" : ""}{record.profitPercent.toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}


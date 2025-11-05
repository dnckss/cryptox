"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Coins, Search, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { ArrowUp, ArrowDown } from "lucide-react"

interface AdminCoin {
  coinId: string
  coinName: string
  coinSymbol: string
  count: number // 구매 횟수
  currentPrice: number
  change24h: number
}

export function AdminCoinsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [coins, setCoins] = useState<AdminCoin[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchCoins()
  }, [])

  // 가격만 업데이트 (1~5초 랜덤 간격)
  useEffect(() => {
    if (loading || coins.length === 0) return

    let timeoutId: NodeJS.Timeout | null = null
    let isMounted = true
    
    const updatePrices = async () => {
      if (!isMounted) return
      
      try {
        // 가격 정보만 빠르게 가져오기
        const response = await fetch("/api/coins?page=1&perPage=100")
        if (response.ok && isMounted) {
          const result = await response.json()
          const marketData = result.data || []

          if (marketData && marketData.length > 0) {
            // 가격과 변동률만 업데이트 (테이블 전체 리렌더링 방지)
            setCoins(prevCoins => 
              prevCoins.map(prevCoin => {
                // coinId나 coinSymbol로 매칭
                const updatedCoin = marketData.find((c: any) => 
                  c.id === prevCoin.coinId || 
                  c.symbol?.toUpperCase() === prevCoin.coinSymbol.toUpperCase()
                )
                if (updatedCoin) {
                  return {
                    ...prevCoin,
                    currentPrice: updatedCoin.current_price || prevCoin.currentPrice,
                    change24h: updatedCoin.price_change_percentage_24h_in_currency || prevCoin.change24h,
                  }
                }
                return prevCoin
              })
            )
          }
        }
      } catch (error) {
        console.error("가격 업데이트 오류:", error)
      }
      
      if (!isMounted) return
      
      // 1~5초 랜덤 간격으로 다음 업데이트 스케줄
      const randomDelay = Math.floor(Math.random() * 4000) + 1000 // 1~5초
      timeoutId = setTimeout(updatePrices, randomDelay)
    }

    // 첫 업데이트 시작
    const randomDelay = Math.floor(Math.random() * 4000) + 1000
    timeoutId = setTimeout(updatePrices, randomDelay)

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [loading, coins.length])

  async function fetchCoins() {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/coins")
      if (!response.ok) {
        throw new Error("Failed to fetch coins")
      }
      const result = await response.json()
      if (result.success) {
        setCoins(result.data || [])
      }
    } catch (error) {
      console.error("Failed to load coins:", error)
      setCoins([])
    } finally {
      setLoading(false)
    }
  }

  // 검색 필터링
  const filteredCoins = coins.filter((coin) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      coin.coinName.toLowerCase().includes(term) ||
      coin.coinSymbol.toLowerCase().includes(term) ||
      coin.coinId.toLowerCase().includes(term)
    )
  })

  if (loading && coins.length === 0) {
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
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">코인 관리</h1>
        <p className="text-gray-400">코인 구매 횟수 및 가격 관리</p>
      </div>

      {/* 검색 */}
      <Card className="bg-transparent border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="코인 이름 또는 심볼로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-primary/20 text-white placeholder:text-gray-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* 코인 목록 */}
      <Card className="bg-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Coins className="w-5 h-5" />
            코인 목록 ({filteredCoins.length}개)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCoins.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">코인이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary/20">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      순위
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      코인
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                      구매 횟수
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                      현재 가격
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                      24h 변동
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoins.map((coin, index) => {
                    const isPositive = coin.change24h >= 0
                    return (
                      <tr
                        key={coin.coinId}
                        className="border-b border-primary/10 hover:bg-black/40 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm text-gray-300">{index + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
                              <span className="text-sm font-bold text-primary">
                                {coin.coinSymbol[0]}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium text-sm">{coin.coinName}</p>
                              <p className="text-gray-400 text-xs">{coin.coinSymbol}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-white font-semibold text-right tabular-nums">
                          {coin.count}회
                        </td>
                        <td className="py-3 px-4 text-sm text-white font-semibold text-right tabular-nums transition-colors duration-300">
                          <span className="inline-block">
                            {coin.currentPrice < 1
                              ? `₩${coin.currentPrice.toFixed(8).replace(/\.?0+$/, "")}`
                              : coin.currentPrice < 1000
                              ? `₩${coin.currentPrice.toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                })}`
                              : `₩${coin.currentPrice.toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div
                            className={cn(
                              "flex items-center justify-end gap-1 text-sm transition-colors duration-300",
                              isPositive ? "text-green-400" : "text-red-400"
                            )}
                          >
                            {isPositive ? (
                              <ArrowUp className="w-4 h-4" />
                            ) : (
                              <ArrowDown className="w-4 h-4" />
                            )}
                            <span className="font-medium tabular-nums">
                              {isPositive ? "+" : ""}
                              {coin.change24h.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => router.push(`/dashboard/admin/coins/${coin.coinSymbol.toLowerCase()}`)}
                            className="text-primary hover:text-primary/80 hover:bg-primary/10 px-3 py-1.5 rounded-md text-sm font-medium transition-colors min-h-[44px] min-w-[44px]"
                          >
                            관리
                          </button>
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
  )
}

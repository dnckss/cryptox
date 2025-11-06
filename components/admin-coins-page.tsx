"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Coins, Search, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { ArrowUp, ArrowDown } from "lucide-react"
import { getWebSocketUrl } from "@/lib/utils/websocket-url"

interface AdminCoin {
  coinId: string
  coinName: string
  coinSymbol: string
  count: number // 구매 횟수
  currentPrice: number
  change24h: number
}

export function AdminCoinsPage() {
  const [loading, setLoading] = useState(true)
  const [coins, setCoins] = useState<AdminCoin[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchCoins()
  }, [])

  // WebSocket을 통한 실시간 가격 업데이트
  useEffect(() => {
    if (loading || coins.length === 0) return

    // 초기 데이터 수신 핸들러
    const handleInitial = (initialCoins: any[]) => {
      // 초기 데이터로 코인 목록 업데이트 (심볼 매칭)
      setCoins((prevCoins) =>
        prevCoins.map((prevCoin) => {
          const initialCoin = initialCoins.find(
            (c: any) =>
              c.coinId === prevCoin.coinId ||
              c.symbol?.toUpperCase() === prevCoin.coinSymbol.toUpperCase()
          )
          if (initialCoin) {
            return {
              ...prevCoin,
              currentPrice: initialCoin.price,
              change24h: initialCoin.change24h,
            }
          }
          return prevCoin
        })
      )
    }

    // 가격 업데이트 수신 핸들러
    const handleUpdate = (updates: any[]) => {
      // 업데이트된 코인만 반영
      setCoins((prevCoins) =>
        prevCoins.map((prevCoin) => {
          const update = updates.find(
            (u: any) =>
              u.coinId === prevCoin.coinId ||
              u.symbol?.toUpperCase() === prevCoin.coinSymbol.toUpperCase()
          )
          if (update) {
            return {
              ...prevCoin,
              currentPrice: update.price,
              change24h: update.change24h,
            }
          }
          return prevCoin
        })
      )
    }

    // WebSocket 연결 설정
    const wsUrl = getWebSocketUrl()

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log("✅ 관리자 코인 목록 WebSocket 연결 성공")
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if (message.type === "initial") {
          handleInitial(message.data)
        } else if (message.type === "update") {
          handleUpdate(message.data)
        }
      } catch (error) {
        console.error("WebSocket 메시지 파싱 오류:", error)
      }
    }

    ws.onerror = (error) => {
      console.error("WebSocket 에러:", error)
    }

    ws.onclose = () => {
      console.log("WebSocket 연결 종료")
    }

    return () => {
      ws.close()
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

  // 검색 필터링 및 구매 횟수 내림차순 정렬
  const filteredCoins = coins
    .filter((coin) => {
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      return (
        coin.coinName.toLowerCase().includes(term) ||
        coin.coinSymbol.toLowerCase().includes(term) ||
        coin.coinId.toLowerCase().includes(term)
      )
    })
    .sort((a, b) => b.count - a.count) // 구매 횟수 내림차순 정렬

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
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="토큰 및 풀 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black/40 border-primary/20 text-white placeholder:text-gray-500"
          />
        </div>
      </div>

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

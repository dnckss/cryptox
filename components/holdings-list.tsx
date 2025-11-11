"use client"

import { useState, useEffect, memo, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { getWebSocketUrl } from "@/lib/utils/websocket-url"

// 가격 셀 컴포넌트 (메모이제이션으로 불필요한 리렌더링 방지)
const PriceCell = memo(({ price }: { price: number }) => (
  <td className="p-4 text-right text-gray-300">
    {price < 1
      ? `₩${price.toFixed(8).replace(/\.?0+$/, "")}`
      : price < 1000
      ? `₩${price.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}`
      : `₩${price.toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })}`}
  </td>
))
PriceCell.displayName = "PriceCell"

interface Holding {
  coinId: string
  coinName: string
  coinSymbol: string
  amount: number
  averageBuyPrice: number
  currentPrice: number
  currentValue: number // 현재 가치 (수량 × 현재 가격)
  totalCost: number // 투자 원금 (수량 × 평균 매수가)
  profit: number // 손익 (현재 가치 - 투자 원금)
  profitPercent: number // 손익률 (%)
}

interface CoinPriceUpdate {
  coinId: string
  symbol: string
  price: number
}

export function HoldingsList() {
  const router = useRouter()
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)
  const wsRef = useRef<WebSocket | null>(null)
  const pricesRef = useRef<Map<string, number>>(new Map()) // WebSocket에서 받은 가격 캐시

  // 가격 업데이트 시 보유 코인 정보 재계산
  const updateHoldingsWithPrices = () => {
    setHoldings(prevHoldings => {
      let totalProfit = 0 // 총 손익 계산
      
      const updatedHoldings = prevHoldings.map(holding => {
        // WebSocket에서 받은 최신 가격 사용
        const currentPrice = pricesRef.current.get(holding.coinId) || 
                           pricesRef.current.get(holding.coinSymbol) || 
                           holding.currentPrice
        
        if (currentPrice <= 0) return holding

        const currentValue = holding.amount * currentPrice
        const totalCost = holding.amount * holding.averageBuyPrice
        const profit = currentValue - totalCost
        const profitPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0

        totalProfit += profit // 총 손익 누적

        return {
          ...holding,
          currentPrice,
          currentValue,
          profit,
          profitPercent,
        }
      })
      
      // 총 손익을 이벤트로 전달 (총 자산 업데이트용)
      window.dispatchEvent(new CustomEvent('holdingsProfitUpdated', {
        detail: { totalProfit }
      }))
      
      // 손익 기준으로 정렬 (손익이 큰 순서대로)
      return updatedHoldings.sort((a, b) => b.profit - a.profit)
    })
  }

  // WebSocket 연결 및 보유 코인 정보 로드
  useEffect(() => {
    let isMounted = true

    // WebSocket 연결 (실시간 가격 업데이트)
    const wsUrl = getWebSocketUrl()
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = async () => {
      console.log("✅ 보유 코인 목록 WebSocket 연결 성공")
      
      // WebSocket 연결 후 보유 코인 정보 가져오기
      try {
        setLoading(true)
        const response = await fetch("/api/user/holdings/detailed")
        if (!response.ok) {
          throw new Error("Failed to fetch holdings")
        }
        const result = await response.json()
        
        if (result.success && isMounted) {
          // 보유 코인 정보 설정 (가격은 WebSocket에서 받음)
          setHoldings(result.data || [])
          
          // 가격은 WebSocket initial 메시지에서 받을 때까지 대기
          // WebSocket initial 메시지가 오면 updateHoldingsWithPrices()가 호출됨
        } else if (isMounted) {
          setHoldings([])
        }
      } catch (error) {
        console.error("Failed to load holdings:", error)
        if (isMounted) {
          setHoldings([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        
        if (message.type === "initial") {
          // 초기 데이터: 모든 코인 가격 저장
          const updates: CoinPriceUpdate[] = message.data
          updates.forEach((update) => {
            pricesRef.current.set(update.coinId, update.price)
            pricesRef.current.set(update.symbol, update.price)
          })
          updateHoldingsWithPrices()
        } else if (message.type === "update") {
          // 가격 업데이트: 해당 코인 가격만 업데이트
          const updates: CoinPriceUpdate[] = message.data
          let hasRelevantUpdate = false
          
          updates.forEach((update) => {
            // 가격 캐시에 저장 (보유 코인인지 확인은 updateHoldingsWithPrices에서)
            pricesRef.current.set(update.coinId, update.price)
            pricesRef.current.set(update.symbol, update.price)
            hasRelevantUpdate = true
          })
          
          if (hasRelevantUpdate) {
            updateHoldingsWithPrices()
          }
        }
      } catch (error) {
        console.error("WebSocket 메시지 파싱 오류:", error)
      }
    }

    ws.onerror = (error) => {
      console.error("WebSocket 에러:", error)
    }

    ws.onclose = () => {
      console.log("보유 코인 목록 WebSocket 연결 종료")
    }

    // 거래 완료 이벤트 리스너 (보유 코인 정보 갱신 필요)
    const handleTradeCompleted = async () => {
      try {
        const response = await fetch("/api/user/holdings/detailed")
        if (response.ok) {
          const result = await response.json()
          if (result.success && isMounted) {
            // 보유 코인 정보만 업데이트 (가격은 WebSocket에서 받음)
            setHoldings(result.data || [])
            
            // WebSocket 가격으로 재계산 (가격은 이미 pricesRef에 있음)
            updateHoldingsWithPrices()
          }
        }
      } catch (error) {
        console.error("Failed to refresh holdings after trade:", error)
      }
    }
    
    window.addEventListener('tradeCompleted', handleTradeCompleted)
    
    return () => {
      isMounted = false
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      window.removeEventListener('tradeCompleted', handleTradeCompleted)
    }
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl border border-primary/20 bg-black/40 backdrop-blur-sm p-6 sm:p-8 text-center">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    )
  }

  if (holdings.length === 0) {
    return (
      <div className="rounded-xl border border-primary/20 bg-black/40 backdrop-blur-sm p-8 sm:p-12 text-center">
        <p className="text-gray-400 text-base sm:text-lg mb-3">보유 코인이 없습니다</p>
        <p className="text-gray-500 text-sm">코인을 구매하여 포트폴리오를 시작해보세요!</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-black/40 backdrop-blur-sm">
      {/* 데스크톱 테이블 */}
      <div className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/20">
                <th className="text-left p-4 text-gray-400 font-medium text-sm">코인</th>
                <th className="text-right p-4 text-gray-400 font-medium text-sm">보유 수량</th>
                <th className="text-right p-4 text-gray-400 font-medium text-sm">현재 가격</th>
                <th className="text-right p-4 text-gray-400 font-medium text-sm">총 가치</th>
                <th className="text-right p-4 text-gray-400 font-medium text-sm">투자 원금</th>
                <th className="text-right p-4 text-gray-400 font-medium text-sm">손익</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => {
                const isPositive = holding.profit >= 0
                return (
                  <tr
                    key={holding.coinId}
                    onClick={() => router.push(`/dashboard/coin/${holding.coinSymbol.toLowerCase()}`)}
                    className="border-b border-primary/10 hover:bg-primary/5 transition-colors cursor-pointer group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
                          <span className="text-sm font-bold text-primary">
                            {holding.coinSymbol[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{holding.coinName}</p>
                          <p className="text-gray-400 text-sm">{holding.coinSymbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right text-white font-medium">
                      {holding.amount < 1
                        ? holding.amount.toFixed(8).replace(/\.?0+$/, "")
                        : holding.amount.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                    </td>
                    <PriceCell price={holding.currentPrice} />
                    <td className="p-4 text-right text-white font-semibold">
                      ₩{Math.round(holding.currentValue).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="p-4 text-right text-gray-400">
                      ₩{Math.round(holding.totalCost).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
                        <div className="flex flex-col items-end">
                          <span className="font-medium">
                            {isPositive ? "+" : ""}₩{Math.round(holding.profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-xs">
                            ({isPositive ? "+" : ""}{holding.profitPercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 모바일 카드 */}
      <div className="md:hidden divide-y divide-primary/10">
        {holdings.map((holding) => {
          const isPositive = holding.profit >= 0
          return (
            <button
              key={holding.coinId}
              type="button"
              onClick={() => router.push(`/dashboard/coin/${holding.coinSymbol.toLowerCase()}`)}
              className="w-full text-left px-4 py-4 flex flex-col gap-3 hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20 flex-shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {holding.coinSymbol[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {holding.coinName}
                    </p>
                    <p className="text-gray-400 text-xs">{holding.coinSymbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold text-sm tabular-nums">
                    ₩{Math.round(holding.currentValue).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <span className="text-xs text-gray-500 tabular-nums">
                    ₩{Math.round(holding.currentPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col text-xs text-gray-400">
                  <span>보유</span>
                  <span className="text-white font-medium text-sm">
                    {holding.amount < 1
                      ? holding.amount.toFixed(6).replace(/\.?0+$/, "")
                      : holding.amount.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                  </span>
                </div>
                <div className="flex flex-col text-xs text-gray-400 text-right">
                  <span>원금</span>
                  <span className="text-sm text-white">
                    ₩{Math.round(holding.totalCost).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div
                  className={cn(
                    "flex flex-col items-end text-xs",
                    isPositive ? "text-green-400" : "text-red-400"
                  )}
                >
                  <span>손익</span>
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    {isPositive ? (
                      <ArrowUp className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5" />
                    )}
                    <span className="tabular-nums">
                      {isPositive ? "+" : ""}₩{Math.round(holding.profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <span className="text-[11px] tabular-nums">
                    ({isPositive ? "+" : ""}{holding.profitPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}


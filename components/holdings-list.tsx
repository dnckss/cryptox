"use client"

import { useState, useEffect, memo } from "react"
import { useRouter } from "next/navigation"
import { ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

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

export function HoldingsList() {
  const router = useRouter()
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)

  // 보유 코인 데이터 로드 및 업데이트 (1초마다)
  useEffect(() => {
    async function fetchHoldings() {
      try {
        if (initialLoad) {
          setLoading(true)
        }
        const response = await fetch("/api/user/holdings/detailed")
        if (!response.ok) {
          throw new Error("Failed to fetch holdings")
        }
        const result = await response.json()
        if (result.success) {
          if (initialLoad) {
            // 초기 로드: 전체 데이터 설정
            setHoldings(result.data || [])
            setInitialLoad(false)
            setLoading(false)
          } else {
            // 이후 업데이트: 가격 정보만 업데이트
            setHoldings(prevHoldings => {
              const newHoldings = prevHoldings.map(prevHolding => {
                const newData = result.data.find((h: Holding) => h.coinId === prevHolding.coinId)
                if (!newData) return prevHolding

                // 가격 관련 정보만 업데이트 (고정 정보는 유지)
                return {
                  ...prevHolding,
                  currentPrice: newData.currentPrice,
                  currentValue: newData.currentValue,
                  profit: newData.profit,
                  profitPercent: newData.profitPercent,
                }
              })
              return newHoldings
            })
          }
        } else {
          if (initialLoad) {
            setHoldings([])
            setInitialLoad(false)
            setLoading(false)
          }
        }
      } catch (error) {
        console.error("Failed to load holdings:", error)
        if (initialLoad) {
          setHoldings([])
          setInitialLoad(false)
          setLoading(false)
        }
      }
    }

    fetchHoldings()
    
    // 1초마다 업데이트 (초기 로드 포함)
    const interval = setInterval(fetchHoldings, 1000)
    
    // 거래 완료 이벤트 리스너 (판매/구매 후 즉시 업데이트)
    const handleTradeCompleted = () => {
      fetchHoldings()
    }
    window.addEventListener('tradeCompleted', handleTradeCompleted)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('tradeCompleted', handleTradeCompleted)
    }
  }, [initialLoad])

  if (loading) {
    return (
      <div className="rounded-xl border border-primary/20 bg-black/40 backdrop-blur-sm p-8 text-center">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    )
  }

  if (holdings.length === 0) {
    return (
      <div className="rounded-xl border border-primary/20 bg-black/40 backdrop-blur-sm p-12 text-center">
        <p className="text-gray-400 text-lg mb-4">보유 코인이 없습니다</p>
        <p className="text-gray-500 text-sm">코인을 구매하여 포트폴리오를 시작해보세요!</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-black/40 backdrop-blur-sm overflow-hidden">
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
                  {/* 고정 정보 (리렌더링 안 됨) */}
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
                  
                  {/* 가격 정보 (업데이트됨) */}
                  <PriceCell price={holding.currentPrice} />
                  
                  {/* 총 가치 (업데이트됨) */}
                  <td className="p-4 text-right text-white font-semibold">
                    ₩{Math.round(holding.currentValue).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  
                  {/* 고정 정보 */}
                  <td className="p-4 text-right text-gray-400">
                    ₩{Math.round(holding.totalCost).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  
                  {/* 손익 (업데이트됨) */}
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
  )
}


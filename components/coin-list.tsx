"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Coin {
  id: string
  name: string
  symbol: string
  price: number
  change1h?: number
  change24h: number
  change1w?: number
  volume24h: number
  marketCap: number
  fdv?: number
}

export function CoinList() {
  const router = useRouter()
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)

  // 초기 데이터 로드
  useEffect(() => {
    async function fetchInitialCoins() {
      try {
        setLoading(true)
        const response = await fetch("/api/coins/popular")
        if (!response.ok) {
          throw new Error("Failed to fetch coins")
        }
        const result = await response.json()
        const coinsData = result.data || []
        
        if (coinsData.length === 0) {
          console.warn("⚠️ API 응답이 비어있습니다")
          setCoins([])
          return
        }

        // 실제 데이터 검증 (가격이 0이 아닌지 확인)
        const hasValidData = coinsData.some((coin: any) => coin.price && coin.price > 0)
        if (!hasValidData) {
          console.warn("⚠️ 유효한 가격 데이터가 없습니다")
        } else {
        }

        setCoins(coinsData)
      } catch (error) {
        console.error("❌ 코인 데이터 로드 오류:", error)
        // 에러 시 빈 배열로 설정
        setCoins([])
      } finally {
        setLoading(false)
      }
    }

    fetchInitialCoins()
  }, [])

  // 가격만 업데이트 (1~5초 랜덤 간격)
  useEffect(() => {
    if (loading || coins.length === 0) return

    let timeoutId: NodeJS.Timeout | null = null
    let isMounted = true
    
    const updatePrices = async () => {
      if (!isMounted) return
      
      try {
        const response = await fetch("/api/coins/popular")
        if (response.ok && isMounted) {
          const result = await response.json()
          const coinsData = result.data || []

          if (coinsData && coinsData.length > 0) {
            // 가격과 변동률만 업데이트 (리스트 전체 리렌더링 방지)
            setCoins(prevCoins => 
              prevCoins.map(prevCoin => {
                const updatedCoin = coinsData.find((c: any) => c.id === prevCoin.id)
                if (updatedCoin) {
                  return {
                    ...prevCoin,
                    price: updatedCoin.price || prevCoin.price,
                    change24h: updatedCoin.change24h || prevCoin.change24h,
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

  if (loading) {
    return (
      <div className="rounded-xl border border-primary/20 bg-black/40 backdrop-blur-sm p-8 text-center">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    )
  }

  if (coins.length === 0) {
    return (
      <div className="rounded-xl border border-primary/20 bg-black/40 backdrop-blur-sm p-8 text-center">
        <p className="text-gray-400">코인 데이터를 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-black/40 backdrop-blur-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary/20">
              <th className="text-left p-4 text-gray-400 font-medium text-sm">순위</th>
              <th className="text-left p-4 text-gray-400 font-medium text-sm">코인</th>
              <th className="text-right p-4 text-gray-400 font-medium text-sm">현재가</th>
              <th className="text-right p-4 text-gray-400 font-medium text-sm">24h 변동</th>
              <th className="text-right p-4 text-gray-400 font-medium text-sm">24h 거래량</th>
              <th className="text-right p-4 text-gray-400 font-medium text-sm">시가총액</th>
            </tr>
          </thead>
          <tbody>
            {coins.map((coin, index) => {
              const isPositive = coin.change24h >= 0
              return (
                <tr
                  key={coin.id}
                  onClick={() => router.push(`/dashboard/coin/${coin.symbol.toLowerCase()}`)}
                  className="border-b border-primary/10 hover:bg-primary/5 transition-colors cursor-pointer group"
                >
                  <td className="p-4 text-gray-400">{index + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
                        <span className="text-sm font-bold text-primary">
                          {coin.symbol[0]}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{coin.name}</p>
                        <p className="text-gray-400 text-sm">{coin.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <p className="text-white font-semibold">
                      {coin.price < 1 
                        ? `₩${coin.price.toFixed(8).replace(/\.?0+$/, '')}` // 소수점 8자리까지, 끝의 0 제거
                        : coin.price < 1000
                        ? `₩${coin.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                        : `₩${coin.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}` // 1000원 이상은 정수
                      }
                    </p>
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
                      <span className="font-medium">
                        {isPositive ? "+" : ""}
                        {coin.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right text-gray-400">
                    ₩{(coin.volume24h / 1_000_000_000).toFixed(1)}B
                  </td>
                  <td className="p-4 text-right text-gray-400">
                    ₩{(coin.marketCap / 1_000_000_000_000).toFixed(1)}T
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


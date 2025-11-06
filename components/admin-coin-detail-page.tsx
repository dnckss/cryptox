"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowUp, ArrowDown, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { getWebSocketUrl } from "@/lib/utils/websocket-url"

interface AdminCoinDetailPageProps {
  symbol: string
}

interface CoinData {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  change24hValue: number
}

export function AdminCoinDetailPage({ symbol }: AdminCoinDetailPageProps) {
  const router = useRouter()
  const [coin, setCoin] = useState<CoinData | null>(null)
  const [loading, setLoading] = useState(true)
  const [priceChangeDirection, setPriceChangeDirection] = useState<"up" | "down">("up")
  const [priceChangePercent, setPriceChangePercent] = useState("0")
  const [delaySeconds, setDelaySeconds] = useState("3")
  const [isApplying, setIsApplying] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // WebSocket을 통한 실시간 가격 업데이트 (초기 데이터도 WebSocket에서 받음)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const isMountedRef = useRef(true)

  useEffect(() => {
    // WebSocket 연결 시작 (coin이 없어도 연결하여 initial 메시지에서 데이터 받음)
    const connectWebSocket = () => {
      if (!isMountedRef.current) return

      // 이미 연결되어 있으면 재연결하지 않음
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        return
      }

      // 기존 연결이 있으면 닫기
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }

      // WebSocket 연결 설정
      const wsUrl = getWebSocketUrl()

      try {
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          console.log("✅ 관리자 코인 상세 페이지 WebSocket 연결 성공")
          reconnectAttemptsRef.current = 0 // 연결 성공 시 재연결 시도 횟수 초기화
        }

        ws.onmessage = (event) => {
          if (!isMountedRef.current || !wsRef.current) return

          try {
            const message = JSON.parse(event.data)
            if (message.type === "initial") {
              // 초기 데이터 수신 (WebSocket에서 모든 코인 데이터를 받음)
              const initialCoin = message.data.find(
                (c: any) => c.symbol?.toUpperCase() === symbol.toUpperCase()
              )
              if (initialCoin) {
                // 초기 코인 데이터 설정
                const coinData: CoinData = {
                  id: initialCoin.coinId || symbol.toLowerCase(),
                  name: symbol.toUpperCase(),
                  symbol: symbol.toUpperCase(),
                  price: initialCoin.price,
                  change24h: initialCoin.change24h,
                  change24hValue: parseFloat((initialCoin.change24h * initialCoin.price / 100).toFixed(2)),
                }
                setCoin(coinData)
                setLoading(false)
              } else {
                // 초기 데이터에서 코인을 찾지 못한 경우
                setLoading(false)
              }
            } else if (message.type === "update") {
              // 가격 업데이트 수신
              const update = message.data.find(
                (u: any) => u.symbol?.toUpperCase() === symbol.toUpperCase()
              )
              if (update) {
                setCoin((prev) => {
                  if (!prev) return prev
                  return {
                    ...prev,
                    price: update.price,
                    change24h: update.change24h,
                    change24hValue: parseFloat((update.change24h * update.price / 100).toFixed(2)),
                  }
                })
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
          if (!isMountedRef.current) return

          console.log("WebSocket 연결 종료")
          wsRef.current = null

          // 자동 재연결 (최대 5회)
          if (reconnectAttemptsRef.current < 5 && isMountedRef.current) {
            reconnectAttemptsRef.current++
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000) // 지수 백오프
            
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                console.log(`재연결 시도 ${reconnectAttemptsRef.current}/5...`)
                connectWebSocket()
              }
            }, delay)
          } else {
            console.error("WebSocket 재연결 실패: 최대 시도 횟수 초과")
          }
        }
      } catch (error) {
        console.error("WebSocket 연결 오류:", error)
      }
    }

    // WebSocket 연결 시작
    connectWebSocket()

    // 정리 함수
    return () => {
      isMountedRef.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [symbol]) // symbol만 의존성으로 사용 (coin은 WebSocket에서 받음)

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen])

  // fetchCoinData 함수 제거 - WebSocket의 initial 메시지에서 초기 데이터를 받음

  const handleApplyPriceChange = async () => {
    const percent = parseFloat(priceChangePercent)
    const delay = parseFloat(delaySeconds)

    if (isNaN(percent) || percent <= 0) {
      alert("유효한 가격 변동 비율을 입력해주세요. (0보다 큰 값)")
      return
    }

    if (isNaN(delay) || delay < 0) {
      alert("유효한 적용 시간을 입력해주세요. (0초 이상)")
      return
    }

    if (!coin || coin.price <= 0) {
      alert("코인 가격 정보를 불러올 수 없습니다.")
      return
    }

    // WebSocket에서 받은 현재 가격 사용
    const currentPrice = coin.price
    // 방향에 따라 양수/음수 변환
    const finalPercent = priceChangeDirection === "up" ? percent : -percent
    // 새 가격 계산
    const newPrice = currentPrice * (1 + finalPercent / 100)

    setIsApplying(true)
    setCountdown(Math.ceil(delay))

    // 카운트다운 시작
    let countdownInterval: NodeJS.Timeout | null = null
    countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownInterval) clearInterval(countdownInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    try {
      // 설정한 시간 후 가격 변경 적용 (클라이언트에서 지연 처리)
      const delayMs = delay * 1000
      setTimeout(async () => {
        try {
          // 지연 시간이 지난 후 API 호출 (즉시 가격 업데이트)
          const response = await fetch(`/api/admin/coins/${symbol}/price`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              priceChangePercent: finalPercent,
              delaySeconds: 0, // 클라이언트에서 이미 지연 처리했으므로 0으로 설정
              currentPrice: currentPrice, // WebSocket에서 받은 현재 가격 전달
              newPrice: newPrice, // 계산된 새 가격 전달
            }),
          })

          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              // WebSocket에서 받은 현재 가격과 계산된 새 가격 사용
              alert(`가격 변경이 적용되었습니다.\n현재: ₩${currentPrice.toLocaleString()}\n변경 후: ₩${newPrice.toLocaleString()}`)
              // 가격은 WebSocket을 통해 자동으로 업데이트됨
              setPriceChangePercent("0")
              setPriceChangeDirection("up")
            }
          } else {
            const errorData = await response.json()
            alert(errorData.error || "가격 변경에 실패했습니다.")
          }
        } catch (error) {
          console.error("Failed to apply price change:", error)
          alert("가격 변경에 실패했습니다.")
        } finally {
          setIsApplying(false)
          setCountdown(0)
          if (countdownInterval) clearInterval(countdownInterval)
        }
      }, delayMs)
    } catch (error) {
      console.error("Error:", error)
      setIsApplying(false)
      setCountdown(0)
      if (countdownInterval) clearInterval(countdownInterval)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl border border-primary/20 bg-black/40 p-8">
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!coin) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl border border-primary/20 bg-black/40 p-8">
          <p className="text-gray-400">코인 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    )
  }

  const isPositive = coin.change24h >= 0
  const percentValue = parseFloat(priceChangePercent || "0")
  const finalPercent = priceChangeDirection === "up" ? percentValue : -percentValue
  const newPrice = coin.price * (1 + finalPercent / 100)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-white hover:bg-primary/10 min-w-[44px] min-h-[44px]"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <span>코인 관리</span>
            <span>/</span>
            <span className="text-white">{coin.symbol}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
            <span className="text-xl font-bold text-primary">{coin.symbol[0]}</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{coin.name}</h1>
            <p className="text-gray-400">{coin.symbol}</p>
          </div>
        </div>
      </div>

      {/* 현재 가격 정보 */}
      <Card className="bg-transparent border-primary/20 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-xl">현재 가격 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-gradient-to-br from-black/60 to-black/40 border border-primary/20">
              <p className="text-sm text-gray-400 mb-3">현재 가격</p>
              <p className="text-3xl font-bold text-white tabular-nums">
                {coin.price < 1
                  ? `₩${coin.price.toFixed(8).replace(/\.?0+$/, "")}`
                  : coin.price < 1000
                  ? `₩${coin.price.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}`
                  : `₩${coin.price.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}`}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-black/60 to-black/40 border border-primary/20">
              <p className="text-sm text-gray-400 mb-3">24시간 변동</p>
              <div
                className={cn(
                  "flex items-center gap-2 text-2xl font-bold",
                  isPositive ? "text-green-400" : "text-red-400"
                )}
              >
                {isPositive ? (
                  <ArrowUp className="w-6 h-6" />
                ) : (
                  <ArrowDown className="w-6 h-6" />
                )}
                <span className="tabular-nums">
                  {isPositive ? "+" : ""}
                  {coin.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 가격 조절 */}
      <Card className="bg-transparent border-primary/20 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-xl">가격 조절</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 방향 선택 */}
            <div className="space-y-2">
              <Label htmlFor="price-direction" className="text-white text-sm font-medium">
                방향
              </Label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => !isApplying && setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isApplying}
                  className={cn(
                    "w-full h-12 px-4 bg-black/40 border border-primary/20 rounded-lg text-white text-base font-medium flex items-center justify-between transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                    "hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                    isDropdownOpen && "ring-2 ring-primary/50 border-primary"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {priceChangeDirection === "up" ? (
                      <>
                        <ArrowUp className="w-4 h-4 text-green-400" />
                        <span>상승</span>
                      </>
                    ) : (
                      <>
                        <ArrowDown className="w-4 h-4 text-red-400" />
                        <span>하락</span>
                      </>
                    )}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 text-gray-400 transition-transform",
                      isDropdownOpen && "transform rotate-180"
                    )}
                  />
                </button>
                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-black/95 backdrop-blur-sm border border-primary/20 rounded-lg shadow-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setPriceChangeDirection("up")
                        setIsDropdownOpen(false)
                      }}
                      className={cn(
                        "w-full px-4 py-3 text-left flex items-center gap-3 transition-colors",
                        priceChangeDirection === "up"
                          ? "bg-primary/20 text-white"
                          : "text-white hover:bg-black/60"
                      )}
                    >
                      <ArrowUp className="w-4 h-4 text-green-400" />
                      <span>상승</span>
                      {priceChangeDirection === "up" && (
                        <span className="ml-auto text-primary">✓</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPriceChangeDirection("down")
                        setIsDropdownOpen(false)
                      }}
                      className={cn(
                        "w-full px-4 py-3 text-left flex items-center gap-3 transition-colors border-t border-primary/10",
                        priceChangeDirection === "down"
                          ? "bg-primary/20 text-white"
                          : "text-white hover:bg-black/60"
                      )}
                    >
                      <ArrowDown className="w-4 h-4 text-red-400" />
                      <span>하락</span>
                      {priceChangeDirection === "down" && (
                        <span className="ml-auto text-primary">✓</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 변동률 입력 */}
            <div className="space-y-2">
              <Label htmlFor="price-change" className="text-white text-sm font-medium">
                변동률 (%)
              </Label>
              <Input
                id="price-change"
                type="number"
                value={priceChangePercent}
                onChange={(e) => setPriceChangePercent(e.target.value)}
                placeholder="예: 10"
                className="h-12 bg-black/40 border-primary/20 text-white text-base font-medium tabular-nums placeholder:text-gray-500 focus:ring-2 focus:ring-primary/50"
                step="0.1"
                min="0"
                disabled={isApplying}
              />
            </div>

            {/* 적용 시간 */}
            <div className="space-y-2">
              <Label htmlFor="delay-seconds" className="text-white text-sm font-medium">
                적용 시간 (초)
              </Label>
              <Input
                id="delay-seconds"
                type="number"
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(e.target.value)}
                placeholder="예: 3"
                className="h-12 bg-black/40 border-primary/20 text-white text-base font-medium tabular-nums placeholder:text-gray-500 focus:ring-2 focus:ring-primary/50"
                step="0.1"
                min="0"
                disabled={isApplying}
              />
            </div>
          </div>

          {/* 변경 예상 가격 */}
          {priceChangePercent && parseFloat(priceChangePercent) > 0 && (
            <div className="p-5 rounded-xl border border-primary/20 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm">
              <p className="text-sm text-gray-400 mb-3">변경 예상 가격</p>
              <div className="flex items-baseline gap-3 mb-2">
                <p className="text-3xl font-bold text-white tabular-nums">
                  {newPrice < 1
                    ? `₩${newPrice.toFixed(8).replace(/\.?0+$/, "")}`
                    : newPrice < 1000
                    ? `₩${newPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}`
                    : `₩${newPrice.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}`}
                </p>
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium",
                    priceChangeDirection === "up"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  )}
                >
                  {priceChangeDirection === "up" ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )}
                  <span className="tabular-nums">
                    {priceChangeDirection === "up" ? "+" : "-"}
                    {percentValue.toFixed(2)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                현재 가격: ₩{coin.price < 1
                  ? coin.price.toFixed(8).replace(/\.?0+$/, "")
                  : coin.price < 1000
                  ? coin.price.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })
                  : coin.price.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
              </p>
            </div>
          )}

          {/* 적용 버튼 */}
          <Button
            onClick={handleApplyPriceChange}
            disabled={
              isApplying ||
              !priceChangePercent ||
              parseFloat(priceChangePercent) <= 0 ||
              isNaN(parseFloat(priceChangePercent)) ||
              !delaySeconds ||
              isNaN(parseFloat(delaySeconds)) ||
              parseFloat(delaySeconds) < 0
            }
            className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 text-white font-semibold hover:from-primary/90 hover:to-primary/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
          >
            {isApplying ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-pulse">적용 중...</span>
                <span className="text-sm font-normal">({countdown}초 후 적용)</span>
              </span>
            ) : (
              `가격 변경 적용 (${delaySeconds || 3}초 후)`
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

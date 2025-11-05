"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Coin {
  id: string
  name: string
  symbol: string
  price: number
}

interface OrderTicketSheetProps {
  isOpen: boolean
  onClose: () => void
  coin: Coin | null
  onBuy: (amountKRW: number) => Promise<void>
  onSell: (amount: number) => Promise<void>
  holding?: {
    amount: number
    averageBuyPrice: number
  } | null
}

export function OrderTicketSheet({
  isOpen,
  onClose,
  coin,
  onBuy,
  onSell,
  holding,
}: OrderTicketSheetProps) {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")
  const [buyAmountKRW, setBuyAmountKRW] = useState("0")
  const [buyAmount, setBuyAmount] = useState("0")
  const [sellAmount, setSellAmount] = useState("0")
  const [sellAmountKRW, setSellAmountKRW] = useState("0")
  const [trading, setTrading] = useState(false)

  // 코인 변경 시 탭 초기화
  useEffect(() => {
    if (coin) {
      setActiveTab("buy")
      setBuyAmountKRW("0")
      setBuyAmount("0")
      setSellAmount("0")
      setSellAmountKRW("0")
    }
  }, [coin])

  // 구매 금액(원화) 변경 시 코인 수량 계산
  useEffect(() => {
    if (buyAmountKRW && coin && coin.price > 0) {
      const krwAmount = parseFloat(buyAmountKRW) || 0
      const coinAmount = krwAmount / coin.price
      setBuyAmount(coinAmount.toFixed(8))
    } else {
      setBuyAmount("0")
    }
  }, [buyAmountKRW, coin])

  // 판매 코인 수량 변경 시 원화 금액 계산
  useEffect(() => {
    if (sellAmount && coin && coin.price > 0) {
      const coinAmount = parseFloat(sellAmount) || 0
      const krwAmount = coinAmount * coin.price
      setSellAmountKRW(krwAmount.toFixed(0))
    } else {
      setSellAmountKRW("0")
    }
  }, [sellAmount, coin])

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  const handleBuy = async () => {
    const krwAmount = parseFloat(buyAmountKRW) || 0
    if (krwAmount <= 0) {
      alert("구매 금액을 입력해주세요.")
      return
    }

    setTrading(true)
    try {
      await onBuy(krwAmount)
      setBuyAmountKRW("0")
      setBuyAmount("0")
      onClose()
    } catch (error) {
      // 에러는 이미 onBuy에서 처리됨
      console.error("구매 실패:", error)
    } finally {
      setTrading(false)
    }
  }

  const handleSell = async () => {
    const coinAmount = parseFloat(sellAmount) || 0
    if (coinAmount <= 0) {
      alert("판매 수량을 입력해주세요.")
      return
    }

    if (!holding || holding.amount < coinAmount) {
      alert(`보유량이 부족합니다. (보유: ${holding?.amount.toFixed(8) || 0})`)
      return
    }

    setTrading(true)
    try {
      await onSell(coinAmount)
      setSellAmount("0")
      setSellAmountKRW("0")
      onClose()
    } catch (error) {
      // 에러는 이미 onSell에서 처리됨
      console.error("판매 실패:", error)
    } finally {
      setTrading(false)
    }
  }

  if (!coin) return null

  return (
    <>
      {/* 오버레이 */}
      <div
        className={cn(
          "fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 시트 */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 h-[90vh] max-h-[90vh] bg-card border-t border-primary/20 z-50 transform transition-transform duration-300 ease-in-out lg:hidden overscroll-contain flex flex-col",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-primary/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
              <span className="text-lg font-bold text-primary">{coin.symbol[0]}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{coin.name}</h2>
              <p className="text-sm text-gray-400">{coin.symbol}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-primary/10 min-w-[44px] min-h-[44px]"
            aria-label="거래 티켓 닫기"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          <Card className="bg-transparent border-primary/20">
            <CardHeader>
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "buy" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("buy")}
                  className={cn(
                    "flex-1 min-h-[44px]",
                    activeTab === "buy"
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent text-white hover:bg-primary/10"
                  )}
                >
                  구매
                </Button>
                <Button
                  variant={activeTab === "sell" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("sell")}
                  className={cn(
                    "flex-1 min-h-[44px]",
                    activeTab === "sell"
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent text-white hover:bg-primary/10"
                  )}
                >
                  판매
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 구매 탭 */}
              {activeTab === "buy" && (
                <>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">구매 금액 (원화)</p>
                    <Input
                      type="text"
                      value={buyAmountKRW ? parseFloat(buyAmountKRW || "0").toLocaleString("ko-KR") : ""}
                      onChange={(e) => {
                        // 숫자만 추출 (쉼표 제거)
                        const numericValue = e.target.value.replace(/[^\d]/g, "")
                        setBuyAmountKRW(numericValue || "0")
                      }}
                      placeholder="0"
                      className="w-full bg-black/40 border-primary/20 text-white text-2xl font-bold text-center py-4 min-h-[44px] tabular-nums"
                      inputMode="numeric"
                    />
                    <p className="text-sm text-gray-400 mt-2 text-center">
                      ≈ {parseFloat(buyAmount || "0").toFixed(8)} {coin.symbol}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBuyAmountKRW((prev) => {
                        const current = parseFloat(prev || "0") || 0
                        const newValue = current + 1000000
                        return String(newValue)
                      })}
                      className="flex-1 bg-transparent border-primary/20 text-white hover:bg-primary/10 min-h-[44px]"
                    >
                      ₩100만
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBuyAmountKRW((prev) => {
                        const current = parseFloat(prev || "0") || 0
                        const newValue = current + 10000000
                        return String(newValue)
                      })}
                      className="flex-1 bg-transparent border-primary/20 text-white hover:bg-primary/10 min-h-[44px]"
                    >
                      ₩1000만
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBuyAmountKRW((prev) => {
                        const current = parseFloat(prev || "0") || 0
                        const newValue = current + 50000000
                        return String(newValue)
                      })}
                      className="flex-1 bg-transparent border-primary/20 text-white hover:bg-primary/10 min-h-[44px]"
                    >
                      ₩5000만
                    </Button>
                  </div>

                  <Button
                    onClick={handleBuy}
                    disabled={trading || parseFloat(buyAmountKRW) <= 0}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 min-h-[44px]"
                  >
                    {trading ? "처리 중..." : "구매"}
                  </Button>
                </>
              )}

              {/* 판매 탭 */}
              {activeTab === "sell" && (
                <>
                  <div>
                    <p className="text-sm text-gray-400 mb-2">판매 수량 ({coin.symbol})</p>
                    {holding && (
                      <p className="text-xs text-gray-500 mb-2">
                        보유: {holding.amount.toFixed(8)} {coin.symbol}
                      </p>
                    )}
                    <Input
                      type="number"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-black/40 border-primary/20 text-white text-2xl font-bold text-center py-4 min-h-[44px]"
                      step="0.00000001"
                      min="0"
                      max={holding?.amount || 0}
                    />
                    <p className="text-sm text-gray-400 mt-2 text-center">
                      ≈ ₩{parseFloat(sellAmountKRW || "0").toLocaleString()}
                    </p>
                  </div>

                  {holding && holding.amount > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const amount = (holding.amount * 0.25).toFixed(8)
                          setSellAmount(amount)
                        }}
                        className="bg-transparent border-primary/20 text-white hover:bg-primary/10 min-h-[44px]"
                      >
                        25%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const amount = (holding.amount * 0.5).toFixed(8)
                          setSellAmount(amount)
                        }}
                        className="bg-transparent border-primary/20 text-white hover:bg-primary/10 min-h-[44px]"
                      >
                        50%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const amount = (holding.amount * 0.75).toFixed(8)
                          setSellAmount(amount)
                        }}
                        className="bg-transparent border-primary/20 text-white hover:bg-primary/10 min-h-[44px]"
                      >
                        75%
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSellAmount(holding.amount.toFixed(8))
                        }}
                        className="bg-transparent border-primary/20 text-white hover:bg-primary/10 min-h-[44px]"
                      >
                        최대
                      </Button>
                    </div>
                  )}

                  {!holding || holding.amount === 0 ? (
                    <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/10">
                      <p className="text-sm text-red-400 text-center">
                        보유한 {coin.symbol}가 없습니다.
                      </p>
                    </div>
                  ) : (
                    <Button
                      onClick={handleSell}
                      disabled={
                        trading ||
                        parseFloat(sellAmount) <= 0 ||
                        parseFloat(sellAmount) > holding.amount
                      }
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 min-h-[44px]"
                    >
                      {trading ? "처리 중..." : "판매"}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

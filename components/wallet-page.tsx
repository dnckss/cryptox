"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChargePackage {
  id: string
  virtualAmount: number // 가상 자산 (원)
  realPrice: number // 실제 가격 (원)
  bonus?: number // 보너스 퍼센트
  popular?: boolean
}

const chargePackages: ChargePackage[] = [
  {
    id: "starter",
    virtualAmount: 10_000_000, // 1천만원
    realPrice: 2_000,
  },
  {
    id: "basic",
    virtualAmount: 50_000_000, // 5천만원
    realPrice: 9_000,
    bonus: 10,
  },
  {
    id: "premium",
    virtualAmount: 100_000_000, // 1억원
    realPrice: 15_000,
    bonus: 20,
    popular: true,
  },
  {
    id: "pro",
    virtualAmount: 300_000_000, // 3억원
    realPrice: 40_000,
    bonus: 33,
  },
  {
    id: "elite",
    virtualAmount: 500_000_000, // 5억원
    realPrice: 60_000,
    bonus: 50,
  },
  {
    id: "master",
    virtualAmount: 1_000_000_000, // 10억원
    realPrice: 100_000,
    bonus: 67,
  },
]

export function WalletPage() {
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [initialBalance, setInitialBalance] = useState(0)
  const [totalCharged, setTotalCharged] = useState(0)
  const [totalChargedVirtual, setTotalChargedVirtual] = useState(0) // 충전된 가상 자산 총합
  const [totalAssets, setTotalAssets] = useState(0) // 총 자산 (잔고 + 보유 코인 현재 가치)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)

  // 초기 자산 데이터 로드
  useEffect(() => {
    async function fetchAssets() {
      try {
        const response = await fetch("/api/user/assets")
        if (!response.ok) {
          throw new Error("Failed to fetch assets")
        }
        const result = await response.json()
        if (result.success) {
          setBalance(result.data.balance)
          setInitialBalance(result.data.initialBalance)
          setTotalCharged(result.data.totalCharged)
          setTotalChargedVirtual(result.data.totalChargedVirtual || 0)
          setTotalAssets(result.data.totalAssets || result.data.balance) // 총 자산
        }
      } catch (error) {
        console.error("Failed to load user assets:", error)
        // 폴백 데이터
        setBalance(50_000_000)
        setInitialBalance(50_000_000)
        setTotalCharged(0)
        setTotalChargedVirtual(0)
        setTotalAssets(50_000_000)
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
    
    // 1초마다 자산 업데이트 (가격 변동 반영)
    const interval = setInterval(fetchAssets, 1000)
    return () => clearInterval(interval)
  }, [])

  // 총 자산 = 잔고 + 보유 코인 현재 가치
  const totalValue = totalAssets
  
  // 총 투자 원금 = 초기 자본 + 충전한 가상 자산
  const totalInvestment = initialBalance + totalChargedVirtual
  
  // 실제 손익 = (현재 잔고 + 보유 코인 현재 가치) - (초기 자본 + 충전한 가상 자산)
  const profit = totalValue - totalInvestment
  const profitPercentage = initialBalance > 0 ? ((profit / initialBalance) * 100).toFixed(2) : "0.00"

  const handleCharge = async (pkg: ChargePackage) => {
    setSelectedPackage(pkg.id)
    
    try {
      // API를 통해 충전 요청
      const response = await fetch("/api/user/assets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "charge",
          amount: pkg.virtualAmount,
          realPrice: pkg.realPrice,
          packageId: pkg.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to charge")
      }

      const result = await response.json()
      if (result.success) {
        setBalance(result.data.balance)
        setTotalCharged(result.data.totalCharged)
        setTotalChargedVirtual(result.data.totalChargedVirtual || 0)
        setTotalAssets(result.data.totalAssets || result.data.balance) // 총 자산 업데이트
        alert(`${(pkg.virtualAmount / 10_000).toLocaleString()}만원이 충전되었습니다!`)
      }
    } catch (error) {
      console.error("Failed to charge:", error)
      alert("충전에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setSelectedPackage(null)
    }
  }

  if (loading) {
    return (
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400">로딩 중...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">내 지갑</h1>
          <p className="text-gray-400">모의 거래 자산을 관리하고 충전하세요</p>
        </div>

        {/* 현재 자산 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 총 자산 */}
          <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border-primary/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                총 자산
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white mb-2">
                ₩{Math.round(totalValue).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-gray-400">
                잔고: ₩{Math.round(balance).toLocaleString(undefined, { maximumFractionDigits: 0 })} + 보유 코인: ₩{Math.round(totalValue - balance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>

          {/* 총 수익/손실 */}
          <Card className="bg-transparent border-primary/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                {profit >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
                총 손익
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-4xl font-bold mb-2",
                  profit >= 0 ? "text-green-400" : "text-red-400"
                )}
              >
                {profit >= 0 ? "+" : ""}₩{Math.round(profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className={cn("text-sm", profit >= 0 ? "text-green-400" : "text-red-400")}>
                {profit >= 0 ? "+" : ""}{profitPercentage}%
              </p>
            </CardContent>
          </Card>

          {/* 총 충전 금액 */}
          <Card className="bg-transparent border-primary/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                총 충전 금액
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white mb-2">
                ₩{Math.round(totalCharged).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-gray-400">실제 결제 금액</p>
            </CardContent>
          </Card>
        </div>

        {/* 충전하기 섹션 */}
        <Card className="bg-transparent border-primary/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Plus className="w-5 h-5" />
              자산 충전하기
            </CardTitle>
            <CardDescription className="text-gray-400">
              모의 거래를 위한 가상 자산을 충전하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chargePackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={cn(
                    "relative p-6 rounded-lg border transition-all cursor-pointer hover:scale-105",
                    pkg.popular
                      ? "border-primary bg-primary/10"
                      : "border-primary/20 bg-black/40 hover:bg-black/60"
                  )}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                      인기
                    </div>
                  )}
                  
                  {pkg.bonus && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded border border-green-500/30">
                      +{pkg.bonus}%
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-2xl font-bold text-white mb-1">
                      ₩{(pkg.virtualAmount / 10_000).toLocaleString()}만
                    </p>
                    <p className="text-sm text-gray-400">가상 자산</p>
                  </div>

                  <div className="mb-4 pb-4 border-b border-primary/10">
                    <p className="text-3xl font-bold text-primary">
                      ₩{pkg.realPrice.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">실제 결제 금액</p>
                  </div>

                  <Button
                    onClick={() => handleCharge(pkg)}
                    disabled={selectedPackage === pkg.id}
                    className={cn(
                      "w-full",
                      pkg.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-transparent border border-primary/30 text-white hover:bg-primary/10"
                    )}
                  >
                    {selectedPackage === pkg.id ? "충전 중..." : "충전하기"}
                  </Button>
                </div>
              ))}
            </div>

            {/* 안내 문구 */}
            <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-gray-400">
                <span className="text-primary font-semibold">💡 알림:</span> 이것은 모의 거래 플랫폼입니다. 
                실제 돈이 결제되지 않으며, 충전된 자산은 가상 거래에만 사용됩니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}


"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wallet, Plus, TrendingUp, TrendingDown, DollarSign, X, Copy, CheckCircle, Clock, CheckCircle2, XCircle, History } from "lucide-react"
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
    id: "package_500",
    virtualAmount: 5_000_000, // 500만원
    realPrice: 500,
  },
  {
    id: "package_1000",
    virtualAmount: 10_000_000, // 1천만원
    realPrice: 1_000,
    popular: true,
  },
  {
    id: "package_1500",
    virtualAmount: 15_000_000, // 1천5백만원
    realPrice: 1_500,
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
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [currentPackage, setCurrentPackage] = useState<ChargePackage | null>(null)
  const [accountInfo, setAccountInfo] = useState("")
  const [copied, setCopied] = useState(false)
  const [chargeHistory, setChargeHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  
  // 계좌 정보 (실제 운영 시에는 환경변수나 설정에서 가져오기)
  const ADMIN_ACCOUNT = {
    bank: "토스뱅크",
    accountNumber: "1001-6709-5836",
    accountHolder: "김우찬"
  }

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

  // 충전 내역 조회
  useEffect(() => {
    let initialLoad = true

    async function fetchChargeHistory() {
      try {
        // 초기 로드 시에만 loading 상태 설정
        if (initialLoad) {
          setLoadingHistory(true)
        }
        
        const response = await fetch("/api/user/charges")
        if (!response.ok) {
          throw new Error("Failed to fetch charge history")
        }
        const result = await response.json()
        if (result.success) {
          setChargeHistory(result.data || [])
        }
      } catch (error) {
        console.error("Failed to load charge history:", error)
        // 에러 시에만 빈 배열로 설정 (초기 로드가 아닌 경우 기존 데이터 유지)
        if (initialLoad) {
          setChargeHistory([])
        }
      } finally {
        if (initialLoad) {
          setLoadingHistory(false)
          initialLoad = false
        }
      }
    }

    fetchChargeHistory()
    
    // 5초마다 충전 내역 업데이트 (상태 변경 확인, 로딩 상태 변경 없이)
    const interval = setInterval(fetchChargeHistory, 5000)
    return () => clearInterval(interval)
  }, [])

  // 총 자산 = 잔고 + 보유 코인 현재 가치
  const totalValue = totalAssets
  
  // 총 투자 원금 = 초기 자본 (충전은 이미 initialBalance에 반영됨)
  const totalInvestment = initialBalance
  
  // 실제 손익 = (현재 잔고 + 보유 코인 현재 가치) - 초기 자본
  // 충전은 초기 자본금 증가로 처리되므로 수익 계산에서 제외
  const profit = totalValue - totalInvestment
  const profitPercentage = initialBalance > 0 ? ((profit / initialBalance) * 100).toFixed(2) : "0.00"

  const handleChargeClick = (pkg: ChargePackage) => {
    setCurrentPackage(pkg)
    setAccountInfo("")
    setShowAccountModal(true)
  }

  const handleSubmitCharge = async () => {
    if (!currentPackage || !accountInfo.trim()) {
      alert("계좌 정보를 입력해주세요.")
      return
    }

    setSelectedPackage(currentPackage.id)
    
    try {
      // API를 통해 충전 요청 (승인 대기 상태로 저장)
      const response = await fetch("/api/user/assets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "charge",
          amount: currentPackage.virtualAmount,
          realPrice: currentPackage.realPrice,
          packageId: currentPackage.id,
          accountInfo: accountInfo.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to charge")
      }

      const result = await response.json()
      if (result.success) {
        setShowAccountModal(false)
        setCurrentPackage(null)
        setAccountInfo("")
        alert(`충전 신청이 완료되었습니다.\n입금 확인까지 대기 중입니다.`)
        // 충전 내역 새로고침
        const historyResponse = await fetch("/api/user/charges")
        if (historyResponse.ok) {
          const historyResult = await historyResponse.json()
          if (historyResult.success) {
            setChargeHistory(historyResult.data || [])
          }
        }
      }
    } catch (error) {
      console.error("Failed to charge:", error)
      alert("충전 신청에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setSelectedPackage(null)
    }
  }

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(ADMIN_ACCOUNT.accountNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
            <CardTitle className="text-3xl font-bold text-white mb-2">
              충전
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
                    onClick={() => handleChargeClick(pkg)}
                    disabled={selectedPackage === pkg.id}
                    className={cn(
                      "w-full",
                      pkg.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-transparent border border-primary/30 text-white hover:bg-primary/10"
                    )}
                  >
                    {selectedPackage === pkg.id ? "처리 중..." : "충전하기"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 충전 내역 섹션 */}
        <Card className="bg-transparent border-primary/20 mt-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <History className="w-5 h-5" />
              충전 내역
            </CardTitle>
            <CardDescription className="text-gray-400">
              내 충전 신청 내역 및 상태를 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="text-center py-8">
                <p className="text-gray-400">로딩 중...</p>
              </div>
            ) : chargeHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">충전 내역이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chargeHistory.map((charge) => {
                  const getStatusInfo = (status: string) => {
                    switch (status) {
                      case "pending":
                        return {
                          icon: Clock,
                          label: "승인 대기",
                          color: "text-yellow-400",
                          bgColor: "bg-yellow-500/10",
                          borderColor: "border-yellow-400/30",
                        }
                      case "approved":
                        return {
                          icon: CheckCircle2,
                          label: "승인됨",
                          color: "text-green-400",
                          bgColor: "bg-green-500/10",
                          borderColor: "border-green-400/30",
                        }
                      case "rejected":
                        return {
                          icon: XCircle,
                          label: "거절됨",
                          color: "text-red-400",
                          bgColor: "bg-red-500/10",
                          borderColor: "border-red-400/30",
                        }
                      default:
                        return {
                          icon: Clock,
                          label: status,
                          color: "text-gray-400",
                          bgColor: "bg-gray-500/10",
                          borderColor: "border-gray-400/30",
                        }
                    }
                  }

                  const statusInfo = getStatusInfo(charge.status)
                  const StatusIcon = statusInfo.icon

                  return (
                    <div
                      key={charge.id}
                      className={cn(
                        "rounded-lg border p-4",
                        statusInfo.bgColor,
                        statusInfo.borderColor
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <StatusIcon className={cn("w-5 h-5", statusInfo.color)} />
                            <span className={cn("text-sm font-medium", statusInfo.color)}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400 mb-1">충전 금액</p>
                              <p className="text-white font-medium">
                                ₩{(charge.virtualAmount / 10_000).toLocaleString()}만
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 mb-1">입금 금액</p>
                              <p className="text-white font-medium">
                                ₩{charge.realPrice.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 mb-1">입금자명</p>
                              <p className="text-white font-medium">
                                {charge.accountInfo || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 mb-1">신청 시간</p>
                              <p className="text-gray-300 text-xs">
                                {new Date(charge.createdAt).toLocaleString("ko-KR")}
                              </p>
                            </div>
                          </div>
                          {charge.adminNote && (
                            <div className="mt-3 pt-3 border-t border-primary/20">
                              <p className="text-xs text-gray-400 mb-1">관리자 메모</p>
                              <p className="text-sm text-red-300">{charge.adminNote}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 계좌 정보 입력 모달 */}
        {showAccountModal && currentPackage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="bg-transparent border-primary/30 backdrop-blur-md max-w-lg w-full relative">
              <CardContent className="p-6">
                {/* 닫기 버튼 */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowAccountModal(false)
                    setCurrentPackage(null)
                    setAccountInfo("")
                  }}
                  className="absolute top-4 right-4 text-white hover:bg-primary/20 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>

                <div className="space-y-6">
                  {/* 제목 */}
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">충전 신청</h2>
                    <p className="text-gray-400 text-sm">
                      아래 계좌로 입금하신 후 계좌 정보를 입력해주세요.
                    </p>
                  </div>

                  {/* 패키지 정보 */}
                  <div className="bg-transparent rounded-lg p-4 border border-primary/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400 text-sm">충전 금액</span>
                      <span className="text-xl font-bold text-white">
                        ₩{(currentPackage.virtualAmount / 10_000).toLocaleString()}만
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">입금 금액</span>
                      <span className="text-2xl font-bold text-primary">
                        ₩{currentPackage.realPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* 입금 계좌 정보 */}
                  <div className="bg-transparent rounded-lg p-4 border border-primary/20">
                    <Label className="text-gray-400 text-sm mb-2 block">입금 계좌</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{ADMIN_ACCOUNT.bank}</span>
                        <span className="text-white">{ADMIN_ACCOUNT.accountHolder}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-transparent border border-primary/20 px-3 py-2 rounded text-white font-mono text-sm">
                          {ADMIN_ACCOUNT.accountNumber}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copyAccountNumber}
                          className="bg-transparent border-primary/30 text-white hover:bg-primary/10"
                        >
                          {copied ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 입금자명 입력 */}
                  <div className="space-y-2">
                    <Label htmlFor="account-info" className="text-white">
                      입금자명 *
                    </Label>
                    <Input
                      id="account-info"
                      type="text"
                      placeholder="예: 홍길동"
                      value={accountInfo}
                      onChange={(e) => setAccountInfo(e.target.value)}
                      className="bg-transparent border-primary/20 text-white placeholder:text-gray-500"
                    />
                    <p className="text-xs text-gray-400">
                      입금하실 때 사용하신 입금자명을 입력해주세요.
                    </p>
                  </div>

                  {/* 안내 메시지 */}
                  <div className="bg-transparent border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-yellow-400 text-sm">
                      ⚠️ 입금 확인까지 최대 24시간이 소요될 수 있습니다.<br />
                      입금 후 관리자에게 연락주시면 더 빠르게 처리됩니다.
                    </p>
                  </div>

                  {/* 버튼 */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAccountModal(false)
                        setCurrentPackage(null)
                        setAccountInfo("")
                      }}
                      className="flex-1 bg-transparent border-primary/30 text-white hover:bg-primary/10"
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleSubmitCharge}
                      disabled={selectedPackage === currentPackage.id || !accountInfo.trim()}
                      className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {selectedPackage === currentPackage.id ? "신청 중..." : "충전 신청"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}


"use client"

import { useState, useEffect, useRef } from "react"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"

export function PortfolioSummary() {
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  const [initialBalance, setInitialBalance] = useState(0)
  const [totalChargedVirtual, setTotalChargedVirtual] = useState(0) // 충전된 가상 자산 총합
  const [totalAssets, setTotalAssets] = useState(0) // 총 자산 (잔고 + 보유 코인 현재 가치)
  const [coinCount, setCoinCount] = useState(0) // 보유 코인 종목 수
  const [totalCoinCost, setTotalCoinCost] = useState(0) // 보유 코인 구매 원금
  const [coinProfit, setCoinProfit] = useState(0) // 코인 수익 (실시간 업데이트)
  const [realTimeCoinProfit, setRealTimeCoinProfit] = useState(0) // 실시간 보유 코인 손익
  
  // 최신 값 참조용 ref
  const balanceRef = useRef(0)
  const totalCoinCostRef = useRef(0)

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
          balanceRef.current = result.data.balance
          setInitialBalance(result.data.initialBalance)
          setTotalChargedVirtual(result.data.totalChargedVirtual || 0)
          // 초기 총 자산은 API에서 받은 값 사용
          setTotalAssets(result.data.totalAssets || result.data.balance)
          setCoinCount(result.data.coinCount || 0)
          setTotalCoinCost(result.data.totalCoinCost || 0)
          totalCoinCostRef.current = result.data.totalCoinCost || 0
          setCoinProfit(result.data.coinProfit || 0)
          // 초기 실시간 손익도 API 값으로 설정
          setRealTimeCoinProfit(result.data.coinProfit || 0)
        }
      } catch (error) {
        console.error("Failed to load user assets:", error)
        // 폴백 데이터
        setBalance(50_000_000)
        balanceRef.current = 50_000_000
        setInitialBalance(50_000_000)
        setTotalChargedVirtual(0)
        setTotalAssets(50_000_000)
        setCoinCount(0)
        setTotalCoinCost(0)
        totalCoinCostRef.current = 0
        setCoinProfit(0)
        setRealTimeCoinProfit(0)
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
    
    // 5초마다 자산 업데이트 (가격 변동 반영)
    const interval = setInterval(fetchAssets, 5000)
    
    // 거래 완료 이벤트 리스너 (판매/구매 후 즉시 업데이트)
    const handleTradeCompleted = () => {
      fetchAssets()
    }
    window.addEventListener('tradeCompleted', handleTradeCompleted)
    
    // 보유 코인 손익 실시간 업데이트 이벤트 리스너
    const handleHoldingsProfitUpdated = (event: CustomEvent<{ totalProfit: number }>) => {
      const newProfit = event.detail.totalProfit
      setRealTimeCoinProfit(newProfit)
      // 총 자산 = 잔고 + 보유 코인 구매 원금 + 실시간 손익
      // = 잔고 + 보유 코인 현재 가치
      setTotalAssets(balanceRef.current + totalCoinCostRef.current + newProfit)
    }
    window.addEventListener('holdingsProfitUpdated', handleHoldingsProfitUpdated as EventListener)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('tradeCompleted', handleTradeCompleted)
      window.removeEventListener('holdingsProfitUpdated', handleHoldingsProfitUpdated as EventListener)
    }
  }, [])
  
  // balance와 totalCoinCost가 변경될 때 ref 업데이트
  useEffect(() => {
    balanceRef.current = balance
  }, [balance])
  
  useEffect(() => {
    totalCoinCostRef.current = totalCoinCost
  }, [totalCoinCost])

  // 총 자산 = 잔고 + 보유 코인 현재 가치
  const totalValue = totalAssets
  
  // 총 투자 원금 = 초기 자본 (충전은 이미 initialBalance에 반영됨)
  const totalInvestment = initialBalance
  
  // 총 수익 = 총 자산 - 초기 자본
  // 충전은 초기 자본금 증가로 처리되므로 수익 계산에서 제외
  const profit = totalValue - totalInvestment
  
  // 수익률 계산 (초기 자본 기준)
  const profitPercent = initialBalance > 0 ? ((profit / initialBalance) * 100).toFixed(2) : "0.00"
  const isPositive = profit >= 0

  if (loading) {
    return (
      <div className="mb-12">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8 mb-8">
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-12">
      {/* 메인 총 자산 카드 */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8 mb-8 backdrop-blur-sm">
        <div className="relative z-10">
          <p className="text-sm text-gray-400 mb-2">총 자산 가치</p>
          <p className="text-5xl font-bold text-white mb-4">
            ₩{Math.round(totalValue).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                isPositive ? "bg-green-500/20" : "bg-red-500/20"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span
                className={`text-sm font-semibold ${
                  isPositive ? "text-green-400" : "text-red-400"
                }`}
              >
                {isPositive ? "+" : ""}
                {profitPercent}%
              </span>
            </div>
            <span className="text-gray-400 text-sm">
              {isPositive ? "+" : ""}₩{Math.round(profit).toLocaleString(undefined, { maximumFractionDigits: 0 })} 수익
            </span>
          </div>
        </div>
        {/* 그라데이션 오버레이 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-primary/20 bg-black/40 p-6 hover:bg-black/60 transition-colors backdrop-blur-sm">
          <div className="mb-3">
            <p className="text-sm text-gray-400 mb-2">초기 자본금</p>
          </div>
          <p className="text-5xl font-bold text-white mb-4">
            ₩{Math.round(initialBalance).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="rounded-xl border border-primary/20 bg-black/40 p-6 hover:bg-black/60 transition-colors backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-gray-400">총 수익</p>
          </div>
          <p
            className={`text-2xl font-bold ${
              isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {isPositive ? "+" : ""}₩{Math.round(profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="rounded-xl border border-primary/20 bg-black/40 p-6 hover:bg-black/60 transition-colors backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-gray-400">보유 코인</p>
          </div>
          <p className="text-2xl font-bold text-white">{coinCount}</p>
          <p className="text-sm text-gray-400 mt-1">종목</p>
        </div>
      </div>
    </div>
  )
}


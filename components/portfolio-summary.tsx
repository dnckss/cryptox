"use client"

import { TrendingUp, TrendingDown, Wallet } from "lucide-react"

export function PortfolioSummary() {
  // TODO: 실제 데이터로 교체
  const totalBalance = 1_000_000 // 초기 자본금
  const totalValue = 1_250_000 // 현재 총 자산
  const profit = totalValue - totalBalance
  const profitPercent = ((profit / totalBalance) * 100).toFixed(2)
  const isPositive = profit >= 0

  return (
    <div className="mb-12">
      {/* 메인 총 자산 카드 */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8 mb-8 backdrop-blur-sm">
        <div className="relative z-10">
          <p className="text-sm text-gray-400 mb-2">총 자산 가치</p>
          <p className="text-5xl font-bold text-white mb-4">
            ₩{totalValue.toLocaleString()}
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
              {isPositive ? "+" : ""}₩{profit.toLocaleString()} 수익
            </span>
          </div>
        </div>
        {/* 그라데이션 오버레이 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-primary/20 bg-black/40 p-6 hover:bg-black/60 transition-colors backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-gray-400">초기 자본금</p>
          </div>
          <p className="text-2xl font-bold text-white">
            ₩{totalBalance.toLocaleString()}
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
            {isPositive ? "+" : ""}₩{profit.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-primary/20 bg-black/40 p-6 hover:bg-black/60 transition-colors backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-gray-400">보유 코인</p>
          </div>
          <p className="text-2xl font-bold text-white">5</p>
          <p className="text-sm text-gray-400 mt-1">종목</p>
        </div>
      </div>
    </div>
  )
}


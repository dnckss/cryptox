"use client"

import { useState, useEffect, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, TrendingUp, TrendingDown, Medal } from "lucide-react"
import { cn } from "@/lib/utils"

interface RankingData {
  rank: number
  userId: string
  nickname: string
  totalAssets: number
  totalProfit: number
  balance: number
  totalCoinValue: number
}

// 랭킹 아이템 컴포넌트 (메모이제이션)
const RankingItem = memo(function RankingItem({ user }: { user: RankingData }) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <Trophy className="w-6 h-6 text-yellow-400" />
    } else if (rank === 2) {
      return <Medal className="w-6 h-6 text-gray-300" />
    } else if (rank === 3) {
      return <Medal className="w-6 h-6 text-amber-600" />
    }
    return null
  }

  const getRankBgColor = (rank: number) => {
    if (rank === 1) {
      return "bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-400/30"
    } else if (rank === 2) {
      return "bg-gradient-to-r from-gray-400/10 to-gray-500/10 border-gray-300/30"
    } else if (rank === 3) {
      return "bg-gradient-to-r from-amber-600/10 to-amber-700/10 border-amber-600/30"
    }
    return "bg-black/40 border-primary/20"
  }

  return (
    <div
      className={cn(
        "rounded-xl border p-6 transition-all hover:bg-black/60",
        getRankBgColor(user.rank)
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20">
            {getRankIcon(user.rank) || (
              <span className="text-lg font-bold text-white">{user.rank}</span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{user.nickname}</h3>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-gray-400">
                잔고: ₩{user.balance.toLocaleString()}
              </span>
              {user.totalCoinValue > 0 && (
                <span className="text-sm text-gray-400">
                  코인: ₩{user.totalCoinValue.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-2xl font-bold text-white">
              ₩{user.totalAssets.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {user.totalProfit >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span
              className={cn(
                "text-sm font-medium",
                user.totalProfit >= 0 ? "text-green-400" : "text-red-400"
              )}
            >
              {user.totalProfit >= 0 ? "+" : ""}
              ₩{Math.abs(user.totalProfit).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})

export function RankingPage() {
  const [loading, setLoading] = useState(true)
  const [rankings, setRankings] = useState<RankingData[]>([])

  useEffect(() => {
    let isMounted = true
    let initialLoad = true

    async function fetchRankings() {
      try {
        // 초기 로드 시에만 loading 상태 설정
        if (initialLoad) {
          setLoading(true)
        }

        const response = await fetch("/api/ranking")
        if (!response.ok) {
          throw new Error("Failed to fetch rankings")
        }
        const result = await response.json()
        if (result.success && isMounted) {
          // 이전 데이터와 비교하여 실제 변경이 있을 때만 업데이트
          setRankings(prevRankings => {
            const newRankings = result.data || []
            // 데이터가 같으면 업데이트하지 않음 (리렌더링 방지)
            if (prevRankings.length === newRankings.length) {
              const hasChanged = prevRankings.some((prev, index) => {
                const next = newRankings[index]
                return (
                  prev.userId !== next.userId ||
                  prev.totalAssets !== next.totalAssets ||
                  prev.totalProfit !== next.totalProfit ||
                  prev.balance !== next.balance ||
                  prev.totalCoinValue !== next.totalCoinValue ||
                  prev.nickname !== next.nickname
                )
              })
              if (!hasChanged) {
                return prevRankings // 변경 없으면 이전 상태 유지 (리렌더링 방지)
              }
            }
            return newRankings // 변경 있으면 새 상태로 업데이트
          })
        }
      } catch (error) {
        console.error("Failed to load rankings:", error)
        if (isMounted && initialLoad) {
          setRankings([])
        }
      } finally {
        if (isMounted && initialLoad) {
          setLoading(false)
          initialLoad = false
        }
      }
    }

    // 초기 로드
    fetchRankings()
    
    // 5초마다 랭킹 업데이트 (로딩 상태 변경 없이, 랭킹 리스트만 업데이트)
    const interval = setInterval(() => {
      if (isMounted) {
        fetchRankings()
      }
    }, 5000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, []) // 의존성 빈 배열 - 초기 로드 시에만 실행

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <Trophy className="w-6 h-6 text-yellow-400" />
    } else if (rank === 2) {
      return <Medal className="w-6 h-6 text-gray-300" />
    } else if (rank === 3) {
      return <Medal className="w-6 h-6 text-amber-600" />
    }
    return null
  }

  const getRankBgColor = (rank: number) => {
    if (rank === 1) {
      return "bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-400/30"
    } else if (rank === 2) {
      return "bg-gradient-to-r from-gray-400/10 to-gray-500/10 border-gray-300/30"
    } else if (rank === 3) {
      return "bg-gradient-to-r from-amber-600/10 to-amber-700/10 border-amber-600/30"
    }
    return "bg-black/40 border-primary/20"
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="rounded-2xl border border-primary/20 bg-black/40 p-8">
          <p className="text-gray-400">랭킹을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">랭킹</h1>
        <p className="text-gray-400">총 자산 기준 상위 10명</p>
      </div>

      <Card className="border-primary/20 bg-black/40">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-white">실시간 랭킹</CardTitle>
              
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {rankings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">랭킹 데이터가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rankings.map((user) => (
                <RankingItem key={user.userId} user={user} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


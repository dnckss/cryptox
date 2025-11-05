"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Users, TrendingUp, TrendingDown, Wallet, Coins, Activity, Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserStat {
  userId: string
  nickname: string | null
  email: string | null
  displayName: string | null
  totalAssets: number
  totalProfit: number
  profitRate: number
  balance: number
  totalCoinValue: number
  coinCount: number
  transactionCount: number
  totalCharged: number
  totalChargedVirtual: number
  createdAt: string
}

export function AdminUsersPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserStat[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchUserStats()
    
    // 10초마다 자동 새로고침
    const interval = setInterval(fetchUserStats, 10000)
    return () => clearInterval(interval)
  }, [])

  async function fetchUserStats() {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/users/stats")
      if (!response.ok) {
        throw new Error("Failed to fetch user stats")
      }
      const result = await response.json()
      if (result.success) {
        setUsers(result.data || [])
      }
    } catch (error) {
      console.error("Failed to load user stats:", error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  // 검색 필터링
  const filteredUsers = users.filter((user) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (user.nickname?.toLowerCase().includes(term) || false) ||
      (user.displayName?.toLowerCase().includes(term) || false) ||
      user.userId.toLowerCase().includes(term) ||
      (user.email?.toLowerCase().includes(term) || false)
    )
  })

  // 통계 요약
  const stats = {
    totalUsers: users.length,
    totalAssets: users.reduce((sum, user) => sum + user.totalAssets, 0),
    totalProfit: users.reduce((sum, user) => sum + user.totalProfit, 0),
    totalTransactions: users.reduce((sum, user) => sum + user.transactionCount, 0),
    totalCharged: users.reduce((sum, user) => sum + user.totalCharged, 0),
  }

  if (loading && users.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl border border-primary/20 bg-black/40 p-8">
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">사용자 통계</h1>
        <p className="text-gray-400">전체 사용자 자산 및 활동 현황</p>
      </div>

      {/* 통계 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-transparent border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              총 사용자
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
            <p className="text-xs text-gray-400 mt-1">명</p>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              총 자산
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              ₩{(stats.totalAssets / 100_000_000).toFixed(1)}억
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {stats.totalAssets.toLocaleString()}원
            </p>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              {stats.totalProfit >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              총 수익
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-2xl font-bold",
                stats.totalProfit >= 0 ? "text-green-400" : "text-red-400"
              )}
            >
              {stats.totalProfit >= 0 ? "+" : ""}₩
              {(Math.abs(stats.totalProfit) / 100_000_000).toFixed(1)}억
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {stats.totalProfit.toLocaleString()}원
            </p>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              총 거래
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{stats.totalTransactions}</p>
            <p className="text-xs text-gray-400 mt-1">건</p>
          </CardContent>
        </Card>

        <Card className="bg-transparent border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              총 충전
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              ₩{(stats.totalCharged / 1000).toFixed(0)}천
            </p>
            <p className="text-xs text-gray-400 mt-1">{stats.totalCharged.toLocaleString()}원</p>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card className="bg-transparent border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="닉네임 또는 사용자 ID로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-primary/20 text-white placeholder:text-gray-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* 사용자 리스트 */}
      <Card className="bg-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            사용자 목록 ({filteredUsers.length}명)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">사용자가 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary/20">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      순위
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      닉네임
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      Display Name
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                      총 자산
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                      수익/손실
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                      수익률
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                      잔고
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                      코인 가치
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                      보유 종목
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                      거래 횟수
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">
                      충전 금액
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                      가입일
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr
                      key={user.userId}
                      className="border-b border-primary/10 hover:bg-black/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-gray-300">{index + 1}</td>
                      <td className="py-3 px-4 text-sm text-white font-medium">
                        {user.nickname || `사용자${user.userId.slice(0, 8)}`}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300">
                        {user.displayName || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-white font-bold text-right">
                        ₩{user.totalAssets.toLocaleString()}
                      </td>
                      <td
                        className={cn(
                          "py-3 px-4 text-sm font-bold text-right",
                          user.totalProfit >= 0 ? "text-green-400" : "text-red-400"
                        )}
                      >
                        {user.totalProfit >= 0 ? "+" : ""}₩{user.totalProfit.toLocaleString()}
                      </td>
                      <td
                        className={cn(
                          "py-3 px-4 text-sm font-medium text-right",
                          user.profitRate >= 0 ? "text-green-400" : "text-red-400"
                        )}
                      >
                        {user.profitRate >= 0 ? "+" : ""}
                        {user.profitRate.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300 text-right">
                        ₩{user.balance.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300 text-right">
                        ₩{user.totalCoinValue.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Coins className="w-4 h-4" />
                          {user.coinCount}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300 text-right">
                        {user.transactionCount}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-300 text-right">
                        ₩{user.totalCharged.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


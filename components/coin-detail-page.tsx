"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUp, ArrowDown, ChevronDown, ChevronUp, Settings, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CoinDetailPageProps {
  symbol: string
}

// 모의 코인 데이터 (실제로는 API에서 가져와야 함)
function getCoinData(symbol: string) {
  const coins: Record<string, any> = {
    btc: {
      name: "Bitcoin",
      symbol: "BTC",
      price: 95000000,
      change24h: -5.01,
      change24hValue: -192.01,
      tvl: 1270000000,
      marketCap: 4385200000000,
      fdv: 4385200000000,
      volume24h: 1600000000,
      description: "Bitcoin is a decentralized digital currency that enables peer-to-peer transactions without the need for a central authority or intermediary.",
    },
    eth: {
      name: "Ethereum",
      symbol: "ETH",
      price: 3641.33,
      change24h: -5.01,
      change24hValue: -192.01,
      tvl: 1270000000,
      marketCap: 4385200000000,
      fdv: 4385200000000,
      volume24h: 1600000000,
      description: "Ethereum is a smart contract platform that enables developers to build tokens and decentralized applications (dapps). ETH is the native currency for the Ethereum platform and also works as the transaction fees to miners on the Ethereum network. Ethereum is the pioneer for blockchain based smart...",
    },
  }

  return (
    coins[symbol.toLowerCase()] || {
      name: symbol,
      symbol: symbol.toUpperCase(),
      price: 1000,
      change24h: 0,
      change24hValue: 0,
      tvl: 0,
      marketCap: 0,
      fdv: 0,
      volume24h: 0,
      description: `${symbol} is a cryptocurrency...`,
    }
  )
}

export function CoinDetailPage({ symbol }: CoinDetailPageProps) {
  const router = useRouter()
  const coin = getCoinData(symbol)
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")
  const [chartTimeframe, setChartTimeframe] = useState<"1H" | "1D" | "1W" | "1M" | "1Y">("1D")
  
  // 구입
  const [buyAmount, setBuyAmount] = useState("0")
  
  // 판매
  const [sellAmount, setSellAmount] = useState("0")

  const isPositive = coin.change24h >= 0

  // 모의 차트 데이터 생성
  const generateChartData = () => {
    const data = []
    const basePrice = coin.price
    for (let i = 0; i < 50; i++) {
      const variation = (Math.random() - 0.5) * 0.1 // ±5% 변동
      data.push(basePrice * (1 + variation))
    }
    return data
  }

  const chartData = generateChartData()
  const minPrice = Math.min(...chartData)
  const maxPrice = Math.max(...chartData)
  const priceRange = maxPrice - minPrice

  // 모의 트랜잭션 데이터
  const mockTransactions = [
    { type: "buy", amount: "0.5", price: coin.price * 1.001, time: "2분 전" },
    { type: "sell", amount: "1.2", price: coin.price * 0.999, time: "5분 전" },
    { type: "buy", amount: "0.8", price: coin.price * 1.002, time: "8분 전" },
    { type: "sell", amount: "0.3", price: coin.price * 0.998, time: "12분 전" },
    { type: "buy", amount: "2.1", price: coin.price * 1.003, time: "15분 전" },
  ]

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* 브레드크럼 및 헤더 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-white hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Link href="/dashboard/trading" className="hover:text-white transition-colors">
                탐색
              </Link>
              <span>/</span>
              <span>토큰</span>
              <span>/</span>
              <span className="text-white">{coin.symbol}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
                <span className="text-xl font-bold text-primary">{coin.symbol[0]}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{coin.name}</h1>
                <p className="text-gray-400">{coin.symbol}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-white hover:bg-primary/10">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽 컬럼 (차트, 통계, 트랜잭션 풀) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 가격 및 차트 */}
            <Card className="bg-transparent border-primary/20">
              <CardContent className="p-6">
                <div className="mb-6">
                  <p className="text-4xl font-bold text-white mb-2">
                    ${coin.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                  <div className={cn("flex items-center gap-2", isPositive ? "text-green-400" : "text-red-400")}>
                    {isPositive ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                    <span className="text-lg font-semibold">
                      {isPositive ? "+" : ""}${Math.abs(coin.change24hValue).toFixed(2)} ({coin.change24h.toFixed(2)}%)
                    </span>
                  </div>
                </div>

                {/* 차트 영역 */}
                <div className="relative h-64 mb-4">
                  <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* 영역 채우기 */}
                    <path
                      d={`M 0,200 ${chartData
                        .map(
                          (price, i) =>
                            `${(i / (chartData.length - 1)) * 500},${200 - ((price - minPrice) / priceRange) * 200}`
                        )
                        .join(" L ")} L 500,200 Z`}
                      fill="url(#chartGradient)"
                    />
                    {/* 선 그래프 */}
                    <polyline
                      points={chartData
                        .map(
                          (price, i) =>
                            `${(i / (chartData.length - 1)) * 500},${200 - ((price - minPrice) / priceRange) * 200}`
                        )
                        .join(" ")}
                      fill="none"
                      stroke="rgb(139, 92, 246)"
                      strokeWidth="2"
                    />
                  </svg>
                  {/* Y축 가격 레이블 */}
                  <div className="absolute right-0 top-0 flex flex-col justify-between h-full text-xs text-gray-400">
                    <span>${maxPrice.toFixed(2)}</span>
                    <span>${((minPrice + maxPrice) / 2).toFixed(2)}</span>
                    <span>${minPrice.toFixed(2)}</span>
                  </div>
                  {/* X축 시간 레이블 */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400 px-2">
                    <span>오전 11:32</span>
                    <span>오후 3:02</span>
                    <span>오후 9:02</span>
                    <span>오전 3:02</span>
                    <span>11월 4일</span>
                  </div>
                </div>

                {/* 시간대 선택 버튼 */}
                <div className="flex items-center gap-2">
                  {(["1H", "1D", "1W", "1M", "1Y"] as const).map((tf) => (
                    <Button
                      key={tf}
                      variant={chartTimeframe === tf ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartTimeframe(tf)}
                      className={cn(
                        chartTimeframe === tf
                          ? "bg-primary text-primary-foreground"
                          : "bg-transparent border-primary/20 text-white hover:bg-primary/10"
                      )}
                    >
                      {tf}
                    </Button>
                  ))}
                  <div className="ml-auto flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="bg-transparent border-primary/20 text-white">
                      가격
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 통계 */}
            <Card className="bg-transparent border-primary/20">
              <CardHeader>
                <CardTitle className="text-white">통계</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">TVL</p>
                    <p className="text-xl font-semibold text-white">
                      ${(coin.tvl / 100000000).toFixed(1)}억
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">시가총액</p>
                    <p className="text-xl font-semibold text-white">
                      ${(coin.marketCap / 100000000).toFixed(1)}억
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">FDV</p>
                    <p className="text-xl font-semibold text-white">
                      ${(coin.fdv / 100000000).toFixed(1)}억
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">1일 거래량</p>
                    <p className="text-xl font-semibold text-white">
                      ${(coin.volume24h / 100000000).toFixed(1)}억
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 트랜잭션 풀 */}
            <Card className="bg-transparent border-primary/20">
              <CardHeader>
                <CardTitle className="text-white">트랜잭션 풀</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockTransactions.map((tx, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border border-primary/10 hover:bg-primary/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            tx.type === "buy" ? "bg-green-400" : "bg-red-400"
                          )}
                        />
                        <div>
                          <p className="text-white font-medium">
                            {tx.type === "buy" ? "구매" : "판매"} {tx.amount} {coin.symbol}
                          </p>
                          <p className="text-sm text-gray-400">{tx.time}</p>
                        </div>
                      </div>
                      <p className="text-white font-semibold">${tx.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 오른쪽 컬럼 (거래 인터페이스, 정보) */}
          <div className="space-y-6">
            {/* 거래 인터페이스 */}
            <Card className="bg-transparent border-primary/20">
              <CardHeader>
                <div className="flex gap-2">
                  {(["buy", "sell"] as const).map((tab) => (
                    <Button
                      key={tab}
                      variant={activeTab === tab ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        activeTab === tab
                          ? "bg-primary text-primary-foreground"
                          : "bg-transparent text-white hover:bg-primary/10"
                      )}
                    >
                      {tab === "buy" && "구입하다"}
                      {tab === "sell" && "팔기"}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 구입하다 탭 */}
                {activeTab === "buy" && (
                  <>
                    <div>
                      <p className="text-sm text-gray-400 mb-2">당신은 구매하고 있습니다</p>
                      <div className="mb-4">
                        <Input
                          type="number"
                          value={buyAmount}
                          onChange={(e) => setBuyAmount(e.target.value)}
                          placeholder="0"
                          className="w-full bg-black/40 border-primary/20 text-white text-3xl font-bold text-center py-6"
                        />
                        <p className="text-sm text-gray-400 mt-2 text-center">US${buyAmount || "0"}</p>
                      </div>
                      
                      {/* 빠른 금액 선택 버튼 */}
                      <div className="flex gap-2 mb-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBuyAmount("100")}
                          className="flex-1 bg-transparent border-primary/20 text-white hover:bg-primary/10"
                        >
                          $100
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBuyAmount("300")}
                          className="flex-1 bg-transparent border-primary/20 text-white hover:bg-primary/10"
                        >
                          $300
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBuyAmount("1000")}
                          className="flex-1 bg-transparent border-primary/20 text-white hover:bg-primary/10"
                        >
                          $1000
                        </Button>
                      </div>
                    </div>

                    {/* 코인 선택 */}
                    <div className="p-4 rounded-lg border border-primary/20 bg-black/40 hover:bg-black/60 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
                            <span className="text-lg font-bold text-primary">{coin.symbol[0]}</span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{coin.name}</p>
                            <p className="text-gray-400 text-sm">{coin.symbol}</p>
                          </div>
                        </div>
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      구매
                    </Button>
                  </>
                )}

                {/* 팔기 탭 */}
                {activeTab === "sell" && (
                  <>
                    <div>
                      <p className="text-sm text-gray-400 mb-2">판매 중</p>
                      <div className="mb-4">
                        <Input
                          type="number"
                          value={sellAmount}
                          onChange={(e) => setSellAmount(e.target.value)}
                          placeholder="0"
                          className="w-full bg-black/40 border-primary/20 text-white text-3xl font-bold text-center py-6"
                        />
                        <p className="text-sm text-gray-400 mt-2 text-center">US${sellAmount || "0"}</p>
                      </div>
                      
                      {/* 퍼센트 선택 버튼 */}
                      <div className="flex gap-2 mb-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: 실제 보유량의 25% 계산
                            setSellAmount("25")
                          }}
                          className="flex-1 bg-transparent border-primary/20 text-white hover:bg-primary/10"
                        >
                          25%
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSellAmount("50")
                          }}
                          className="flex-1 bg-transparent border-primary/20 text-white hover:bg-primary/10"
                        >
                          50%
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSellAmount("75")
                          }}
                          className="flex-1 bg-transparent border-primary/20 text-white hover:bg-primary/10"
                        >
                          75%
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSellAmount("100")
                          }}
                          className="flex-1 bg-transparent border-primary/20 text-white hover:bg-primary/10"
                        >
                          최대
                        </Button>
                      </div>
                    </div>

                    {/* 토큰 선택 */}
                    <div className="p-4 rounded-lg border border-primary/20 bg-black/40 hover:bg-black/60 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
                            <span className="text-lg font-bold text-primary">{coin.symbol[0]}</span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{coin.name}</p>
                            <p className="text-gray-400 text-sm">{coin.symbol}</p>
                          </div>
                        </div>
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      판매
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 정보 섹션 */}
            <Card className="bg-transparent border-primary/20">
              <CardHeader>
                <CardTitle className="text-white">정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="bg-transparent border-primary/20 text-white hover:bg-primary/10">
                    이더스캔
                  </Button>
                  <Button variant="outline" size="sm" className="bg-transparent border-primary/20 text-white hover:bg-primary/10">
                    웹사이트
                  </Button>
                  <Button variant="outline" size="sm" className="bg-transparent border-primary/20 text-white hover:bg-primary/10">
                    X 트위터
                  </Button>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{coin.description}</p>
                <Button variant="ghost" className="text-primary hover:text-primary/80 p-0 h-auto">
                  자세히보기
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}


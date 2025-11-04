"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Coin {
  id: string
  name: string
  symbol: string
  icon: string
  price: number
  change1h: number
  change1d: number
  change1w: number
  fdv: number
  volume24h: number
}

// 100개 코인 모의 데이터 생성
function generateMockCoins(): Coin[] {
  const coins: Coin[] = []
  const symbols = [
    "BTC", "ETH", "SOL", "ADA", "MATIC", "DOT", "AVAX", "LINK", "UNI", "ATOM",
    "NEAR", "ALGO", "XTZ", "FIL", "ICP", "APT", "SUI", "ARB", "OP", "MANA",
    "SAND", "AXS", "ENJ", "CHZ", "FLOW", "THETA", "EOS", "TRX", "XRP", "DOGE",
    "SHIB", "PEPE", "FLOKI", "WIF", "BONK", "LUNC", "LUNA", "USTC", "LRC", "IMX",
    "GRT", "AAVE", "MKR", "SNX", "COMP", "CRV", "YFI", "1INCH", "BAL", "SUSHI",
    "CAKE", "BAKE", "BNB", "FTM", "ONE", "HARMONY", "ROSE", "CELO", "KLAY", "WAVES",
    "ZIL", "VET", "HBAR", "IOTA", "NANO", "XLM", "XMR", "ZEC", "DASH", "LTC",
    "BCH", "BSV", "ETC", "ZEN", "RVN", "SC", "BAT", "ZRX", "OMG", "KNC",
    "REP", "GNO", "STORJ", "GNT", "ANT", "BNT", "REN", "KEEP", "NU", "LPT",
    "BAND", "AMP", "OXT", "DNT", "RLC", "UMA", "MLN", "ENJ", "MANA", "SAND"
  ]

  const names = [
    "Bitcoin", "Ethereum", "Solana", "Cardano", "Polygon", "Polkadot", "Avalanche", "Chainlink", "Uniswap", "Cosmos",
    "Near Protocol", "Algorand", "Tezos", "Filecoin", "Internet Computer", "Aptos", "Sui", "Arbitrum", "Optimism", "Decentraland",
    "The Sandbox", "Axie Infinity", "Enjin", "Chiliz", "Flow", "Theta Network", "EOS", "TRON", "Ripple", "Dogecoin",
    "Shiba Inu", "Pepe", "FLOKI", "dogwifhat", "Bonk", "Terra Classic", "Terra", "TerraClassicUSD", "Loopring", "Immutable X",
    "The Graph", "Aave", "Maker", "Synthetix", "Compound", "Curve DAO", "yearn.finance", "1inch", "Balancer", "SushiSwap",
    "PancakeSwap", "BakerySwap", "BNB", "Fantom", "Harmony", "Harmony One", "Oasis Network", "Celo", "Klaytn", "Waves",
    "Zilliqa", "VeChain", "Hedera", "IOTA", "Nano", "Stellar", "Monero", "Zcash", "Dash", "Litecoin",
    "Bitcoin Cash", "Bitcoin SV", "Ethereum Classic", "Horizen", "Ravencoin", "Siacoin", "Basic Attention Token", "0x", "OMG Network", "Kyber Network",
    "Augur", "Gnosis", "Storj", "Golem", "Aragon", "Bancor", "Ren", "Keep Network", "NuCypher", "Livepeer",
    "Band Protocol", "Amp", "Orchid", "District0x", "iExec RLC", "UMA", "Enzyme", "Enjin Coin", "Decentraland", "The Sandbox"
  ]

  const basePrices = [
    95000000, 3500000, 150000, 800, 1200, 7000, 50000, 15000, 12000, 10000,
    5000, 200, 1000, 5000, 12000, 10000, 2000, 1500, 3000, 500,
    600, 8000, 300, 200, 1500, 1000, 800, 150, 650, 150,
    0.00002, 0.000001, 0.0001, 3000, 0.00001, 0.0001, 1000, 0.01, 25, 2000,
    200, 120000, 3000000, 3000, 60000, 600, 10000000, 500, 2000, 1500,
    3000, 2000, 600000, 500, 0.02, 0.02, 100, 800, 300, 3000,
    30, 40, 100, 200, 1000, 150, 150000, 30000, 150000, 150000,
    500000, 50000, 30000, 10000, 30, 2, 300, 200, 1000, 200,
    100000, 50000, 50000, 10000, 5000, 500, 3000, 2000, 1000, 2000,
    5000, 10, 50, 10, 100, 200, 100, 300, 500, 600
  ]

  for (let i = 0; i < 100; i++) {
    const change1h = (Math.random() - 0.5) * 4 // -2% ~ +2%
    const change1d = (Math.random() - 0.5) * 20 // -10% ~ +10%
    const change1w = (Math.random() - 0.5) * 40 // -20% ~ +20%
    
    coins.push({
      id: `coin-${i}`,
      name: names[i] || `Coin ${i + 1}`,
      symbol: symbols[i] || `COIN${i + 1}`,
      icon: symbols[i]?.[0] || "?",
      price: basePrices[i] || 1000,
      change1h: parseFloat(change1h.toFixed(2)),
      change1d: parseFloat(change1d.toFixed(2)),
      change1w: parseFloat(change1w.toFixed(2)),
      fdv: basePrices[i] * 1000000000 || 1000000000000,
      volume24h: basePrices[i] * 10000000 || 10000000000,
    })
  }

  return coins
}

// 초기 100개 코인 데이터 생성
const initialCoins = generateMockCoins()

export function TradingPage() {
  const router = useRouter()
  const [coins] = useState<Coin[]>(initialCoins)
  const [searchQuery, setSearchQuery] = useState("")
  const [timeframe, setTimeframe] = useState<"1h" | "1d" | "1w">("1d")
  const [sortBy, setSortBy] = useState<"volume" | "price" | "change">("volume")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  const filteredCoins = coins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedCoins = [...filteredCoins].sort((a, b) => {
    let comparison = 0
    if (sortBy === "volume") {
      comparison = a.volume24h - b.volume24h
    } else if (sortBy === "price") {
      comparison = a.price - b.price
    } else {
      const aChange = timeframe === "1h" ? a.change1h : timeframe === "1d" ? a.change1d : a.change1w
      const bChange = timeframe === "1h" ? b.change1h : timeframe === "1d" ? b.change1d : b.change1w
      comparison = aChange - bChange
    }
    return sortOrder === "asc" ? comparison : -comparison
  })

  const getChangeValue = (coin: Coin) => {
    if (timeframe === "1h") return coin.change1h
    if (timeframe === "1d") return coin.change1d
    return coin.change1w
  }

  // 통계 계산
  const totalVolume = coins.reduce((sum, coin) => sum + coin.volume24h, 0)
  const totalVolumeChange = 26.9 // 모의 데이터
  const totalTVL = totalVolume * 1.05
  const totalTVLChange = -0.32

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">거래</h1>
          <p className="text-gray-400">시장 데이터와 코인 정보를 확인하세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="mb-8">
          <div className="rounded-xl border border-primary/20 bg-black/40 p-6 backdrop-blur-sm w-fit">
            <p className="text-sm text-gray-400 mb-2">1일 거래량</p>
            <p className="text-2xl font-bold text-white mb-1">
              ${(totalVolume / 1_000_000_000).toFixed(3)}B
            </p>
            <div className="flex items-center gap-1 text-green-400">
              <ArrowUp className="w-4 h-4" />
              <span className="text-sm font-medium">{totalVolumeChange}%</span>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="토큰 및 풀 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/40 border-primary/20 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={timeframe === "1h" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe("1h")}
              className={cn(
                timeframe === "1h"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent border-primary/20 text-white hover:bg-primary/10"
              )}
            >
              1시간
            </Button>
            <Button
              variant={timeframe === "1d" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe("1d")}
              className={cn(
                timeframe === "1d"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent border-primary/20 text-white hover:bg-primary/10"
              )}
            >
              1일
            </Button>
            <Button
              variant={timeframe === "1w" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeframe("1w")}
              className={cn(
                timeframe === "1w"
                  ? "bg-primary text-primary-foreground"
                  : "bg-transparent border-primary/20 text-white hover:bg-primary/10"
              )}
            >
              1주
            </Button>
          </div>
        </div>

        {/* 코인 테이블 */}
        <div className="rounded-xl border border-primary/20 bg-black/40 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="text-left p-4 text-gray-400 font-medium text-sm">#</th>
                  <th className="text-left p-4 text-gray-400 font-medium text-sm">토큰 이름</th>
                  <th className="text-right p-4 text-gray-400 font-medium text-sm">가격</th>
                  <th className="text-right p-4 text-gray-400 font-medium text-sm">1시간</th>
                  <th className="text-right p-4 text-gray-400 font-medium text-sm">1일</th>
                  <th className="text-right p-4 text-gray-400 font-medium text-sm">1주</th>
                  <th className="text-right p-4 text-gray-400 font-medium text-sm">FDV</th>
                  <th
                    className="text-right p-4 text-gray-400 font-medium text-sm cursor-pointer hover:text-primary transition-colors"
                    onClick={() => {
                      if (sortBy === "volume") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      } else {
                        setSortBy("volume")
                        setSortOrder("desc")
                      }
                    }}
                  >
                    <div className="flex items-center justify-end gap-1">
                      거래량
                      {sortBy === "volume" && (
                        <span className="text-primary">
                          {sortOrder === "desc" ? "↓" : "↑"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="text-right p-4 text-gray-400 font-medium text-sm">1D 차트</th>
                </tr>
              </thead>
              <tbody>
                {sortedCoins.map((coin, index) => {
                  const change1h = coin.change1h
                  const change1d = coin.change1d
                  const change1w = coin.change1w
                  const currentChange = getChangeValue(coin)

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
                              {coin.icon}
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
                          ${coin.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                      </td>
                      <td className="p-4 text-right">
                        <div
                          className={cn(
                            "flex items-center justify-end gap-1",
                            change1h >= 0 ? "text-green-400" : "text-red-400"
                          )}
                        >
                          {change1h >= 0 ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                          <span className="font-medium">
                            {change1h >= 0 ? "+" : ""}
                            {change1h.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div
                          className={cn(
                            "flex items-center justify-end gap-1",
                            change1d >= 0 ? "text-green-400" : "text-red-400"
                          )}
                        >
                          {change1d >= 0 ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                          <span className="font-medium">
                            {change1d >= 0 ? "+" : ""}
                            {change1d.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div
                          className={cn(
                            "flex items-center justify-end gap-1",
                            change1w >= 0 ? "text-green-400" : "text-red-400"
                          )}
                        >
                          {change1w >= 0 ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                          <span className="font-medium">
                            {change1w >= 0 ? "+" : ""}
                            {change1w.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right text-gray-400">
                        ${(coin.fdv / 1_000_000_000).toFixed(2)}B
                      </td>
                      <td className="p-4 text-right text-gray-400">
                        ${(coin.volume24h / 1_000_000).toFixed(0)}M
                      </td>
                      <td className="p-4 text-right">
                        {/* 간단한 차트 시뮬레이션 */}
                        <div className="inline-flex items-end h-8 gap-px">
                          {Array.from({ length: 24 }).map((_, i) => {
                            const height = 20 + Math.random() * 60
                            const isPositive = Math.random() > 0.3
                            return (
                              <div
                                key={i}
                                className={cn(
                                  "w-1 rounded-t",
                                  isPositive ? "bg-green-400" : "bg-red-400"
                                )}
                                style={{ height: `${height}%` }}
                              />
                            )
                          })}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}


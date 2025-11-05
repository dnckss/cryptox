"use client"

import { useState, useEffect } from "react"
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

// 폴백용 모의 데이터 생성 (API 실패 시 사용)
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

export function TradingPage() {
  const router = useRouter()
  const [coins, setCoins] = useState<Coin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [timeframe, setTimeframe] = useState<"1h" | "1d" | "1w">("1d")
  const [sortBy, setSortBy] = useState<"volume" | "price" | "change">("volume")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // 초기 데이터 로드
  useEffect(() => {
    async function fetchInitialCoins() {
      try {
        setLoading(true)
        const response = await fetch("/api/coins?page=1&perPage=100")
        if (!response.ok) {
          throw new Error("Failed to fetch coins")
        }
        const result = await response.json()
        const marketData = result.data || []

        // API 응답이 비어있으면 에러
        if (!marketData || marketData.length === 0) {
          throw new Error("No market data received from API")
        }

        // CoinGecko 데이터를 우리 형식으로 변환
        const formattedCoins: Coin[] = marketData.map((coin: any) => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol.toUpperCase(),
          icon: coin.symbol.toUpperCase()[0] || "?",
          price: coin.current_price || 0,
          change1h: coin.price_change_percentage_1h_in_currency || 0,
          change1d: coin.price_change_percentage_24h_in_currency || 0,
          change1w: coin.price_change_percentage_7d_in_currency || 0,
          fdv: coin.fully_diluted_valuation || 0,
          volume24h: coin.total_volume || 0,
        }))

        // 실제 데이터가 있는지 확인 (가격이 0이면 폴백 사용)
        const hasValidData = formattedCoins.some(coin => coin.price > 0)
        if (!hasValidData) {
          console.error("Invalid data: all prices are 0")
          throw new Error("Invalid data received from API")
        }

        // 모의 데이터 검증
        if (formattedCoins.length === 0) {
          throw new Error("No coins data received")
        }

        setCoins(formattedCoins)
      } catch (error) {
        console.error("❌ 코인 데이터 로드 오류:", error)
        // 에러 시 빈 배열로 설정
        setCoins([])
      } finally {
        setLoading(false)
      }
    }

    fetchInitialCoins()
  }, [])

  // 가격만 업데이트 (1~5초 랜덤 간격)
  useEffect(() => {
    if (loading || coins.length === 0) return

    let timeoutId: NodeJS.Timeout | null = null
    let isMounted = true
    
    const updatePrices = async () => {
      if (!isMounted) return
      
      try {
        const response = await fetch("/api/coins?page=1&perPage=100")
        if (response.ok && isMounted) {
          const result = await response.json()
          const marketData = result.data || []

          if (marketData && marketData.length > 0) {
            // 가격과 변동률만 업데이트 (테이블 전체 리렌더링 방지)
            setCoins(prevCoins => 
              prevCoins.map(prevCoin => {
                const updatedCoin = marketData.find((c: any) => c.id === prevCoin.id)
                if (updatedCoin) {
                  return {
                    ...prevCoin,
                    price: updatedCoin.current_price || prevCoin.price,
                    change1h: updatedCoin.price_change_percentage_1h_in_currency || prevCoin.change1h,
                    change1d: updatedCoin.price_change_percentage_24h_in_currency || prevCoin.change1d,
                    change1w: updatedCoin.price_change_percentage_7d_in_currency || prevCoin.change1w,
                  }
                }
                return prevCoin
              })
            )
          }
        }
      } catch (error) {
        console.error("가격 업데이트 오류:", error)
      }
      
      if (!isMounted) return
      
      // 1~5초 랜덤 간격으로 다음 업데이트 스케줄
      const randomDelay = Math.floor(Math.random() * 4000) + 1000 // 1~5초
      timeoutId = setTimeout(updatePrices, randomDelay)
    }

    // 첫 업데이트 시작
    const randomDelay = Math.floor(Math.random() * 4000) + 1000
    timeoutId = setTimeout(updatePrices, randomDelay)

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [loading, coins.length])

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
  const totalVolumeChange = 26.9 // 모의 데이터 (실제로는 API에서 가져올 수 있음)
  const totalTVL = totalVolume * 1.05
  const totalTVLChange = -0.32

  if (loading) {
    return (
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-400">로딩 중...</p>
          </div>
        </div>
      </main>
    )
  }

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
              ₩{(totalVolume / 1_000_000_000).toFixed(3)}B
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
                            {coin.price < 1 
                              ? `₩${coin.price.toFixed(8).replace(/\.?0+$/, '')}` // 소수점 8자리까지, 끝의 0 제거
                              : coin.price < 1000
                              ? `₩${coin.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                              : `₩${coin.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}` // 1000원 이상은 정수
                            }
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
                        ₩{(coin.fdv / 1_000_000_000).toFixed(2)}B
                      </td>
                      <td className="p-4 text-right text-gray-400">
                        ₩{(coin.volume24h / 1_000_000).toFixed(0)}M
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


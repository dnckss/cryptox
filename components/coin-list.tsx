"use client"

import { ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Coin {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  volume24h: number
  marketCap: number
}

// TODO: 실제 API 데이터로 교체
const mockCoins: Coin[] = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    price: 95_000_000,
    change24h: 2.5,
    volume24h: 1_500_000_000_000,
    marketCap: 1_800_000_000_000_000,
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    price: 3_500_000,
    change24h: -1.2,
    volume24h: 800_000_000_000,
    marketCap: 420_000_000_000_000,
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    price: 150_000,
    change24h: 5.8,
    volume24h: 200_000_000_000,
    marketCap: 70_000_000_000_000,
  },
  {
    id: "cardano",
    name: "Cardano",
    symbol: "ADA",
    price: 800,
    change24h: 1.3,
    volume24h: 50_000_000_000,
    marketCap: 28_000_000_000_000,
  },
  {
    id: "polygon",
    name: "Polygon",
    symbol: "MATIC",
    price: 1_200,
    change24h: -0.8,
    volume24h: 30_000_000_000,
    marketCap: 12_000_000_000_000,
  },
]

export function CoinList() {
  return (
    <div className="rounded-xl border border-primary/20 bg-black/40 backdrop-blur-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-primary/20">
              <th className="text-left p-4 text-gray-400 font-medium text-sm">순위</th>
              <th className="text-left p-4 text-gray-400 font-medium text-sm">코인</th>
              <th className="text-right p-4 text-gray-400 font-medium text-sm">현재가</th>
              <th className="text-right p-4 text-gray-400 font-medium text-sm">24h 변동</th>
              <th className="text-right p-4 text-gray-400 font-medium text-sm">24h 거래량</th>
              <th className="text-right p-4 text-gray-400 font-medium text-sm">시가총액</th>
            </tr>
          </thead>
          <tbody>
            {mockCoins.map((coin, index) => {
              const isPositive = coin.change24h >= 0
              return (
                <tr
                  key={coin.id}
                  className="border-b border-primary/10 hover:bg-primary/5 transition-colors cursor-pointer group"
                >
                  <td className="p-4 text-gray-400">{index + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20">
                        <span className="text-sm font-bold text-primary">
                          {coin.symbol[0]}
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
                      ₩{coin.price.toLocaleString()}
                    </p>
                  </td>
                  <td className="p-4 text-right">
                    <div
                      className={cn(
                        "flex items-center justify-end gap-1.5",
                        isPositive ? "text-green-400" : "text-red-400"
                      )}
                    >
                      {isPositive ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      )}
                      <span className="font-medium">
                        {isPositive ? "+" : ""}
                        {coin.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right text-gray-400">
                    ₩{(coin.volume24h / 1_000_000_000).toFixed(1)}B
                  </td>
                  <td className="p-4 text-right text-gray-400">
                    ₩{(coin.marketCap / 1_000_000_000_000).toFixed(1)}T
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}


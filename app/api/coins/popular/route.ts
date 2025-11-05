import { NextResponse } from "next/server"
import { getPopularCoins } from "@/lib/mock-coins-service"

/**
 * GET /api/coins/popular
 * 인기 코인 목록 (대시보드용)
 * 상위 5개 코인만 가져오기 (모의 데이터)
 */
export async function GET() {
  try {
    // 상위 5개 인기 코인 가져오기
    const popularCoins = getPopularCoins()

    // 응답 데이터 포맷팅
    const coins = popularCoins.map((coin) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      price: coin.price,
      change1h: coin.change1h,
      change24h: coin.change1d, // 24h = 1d
      change1w: coin.change1w,
      volume24h: coin.volume24h,
      marketCap: coin.marketCap,
      fdv: coin.fdv,
    }))

    return NextResponse.json({ data: coins }, { status: 200 })
  } catch (error) {
    console.error("Error fetching popular coins:", error)
    return NextResponse.json(
      { error: "Failed to fetch popular coins", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}


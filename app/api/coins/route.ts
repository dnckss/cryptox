import { NextResponse } from "next/server"
import { getAllCoinsData } from "@/lib/mock-coins-service"

/**
 * GET /api/coins
 * 코인 시장 데이터 가져오기 (모의 데이터)
 * Query params:
 * - page: 페이지 번호 (기본값: 1)
 * - perPage: 페이지당 항목 수 (기본값: 100, 최대: 250)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const perPage = parseInt(searchParams.get("perPage") || "100", 10)

    // 모든 모의 코인 데이터 가져오기
    const allCoins = getAllCoinsData()
    
    // 페이지네이션
    const startIndex = (page - 1) * perPage
    const endIndex = startIndex + perPage
    const paginatedCoins = allCoins.slice(startIndex, endIndex)

    // CoinGecko 형식으로 변환
    const formattedCoins = paginatedCoins.map((coin, index) => ({
      id: coin.id,
      symbol: coin.symbol.toLowerCase(),
      name: coin.name,
      image: "", // 이미지는 나중에 추가 가능
      current_price: coin.price,
      market_cap: coin.marketCap,
      market_cap_rank: startIndex + index + 1,
      fully_diluted_valuation: coin.fdv,
      total_volume: coin.volume24h,
      price_change_percentage_1h_in_currency: coin.change1h,
      price_change_percentage_24h_in_currency: coin.change1d,
      price_change_percentage_7d_in_currency: coin.change1w,
    }))

    return NextResponse.json({ data: formattedCoins }, { status: 200 })
  } catch (error) {
    console.error("Error fetching coins:", error)
    return NextResponse.json(
      { error: "Failed to fetch coins", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}


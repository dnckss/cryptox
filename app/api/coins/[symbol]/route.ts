import { NextResponse } from "next/server"
import { getCoinDataBySymbol } from "@/lib/mock-coins-service"

/**
 * GET /api/coins/[symbol]
 * 특정 코인의 상세 정보 가져오기 (모의 데이터)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params
    const coinData = getCoinDataBySymbol(symbol)

    if (!coinData) {
      return NextResponse.json(
        { error: "Coin not found" },
        { status: 404 }
      )
    }

    // TVL은 시가총액의 일정 비율로 계산
    const tvl = coinData.marketCap * 0.1 // 시가총액의 10% 가정

    const formattedData = {
      id: coinData.id,
      name: coinData.name,
      symbol: coinData.symbol,
      price: coinData.price,
      change1h: coinData.change1h,
      change24h: coinData.change1d, // 24h = 1d
      change1w: coinData.change1w,
      change24hValue: parseFloat((coinData.change1d * coinData.price / 100).toFixed(2)),
      tvl: tvl,
      marketCap: coinData.marketCap,
      fdv: coinData.fdv,
      volume24h: coinData.volume24h,
      description: `${coinData.name} (${coinData.symbol}) is a cryptocurrency on the cryptoX platform.`,
    }

    return NextResponse.json({ data: formattedData }, { status: 200 })
  } catch (error) {
    console.error("Error fetching coin detail:", error)
    return NextResponse.json(
      { error: "Failed to fetch coin detail", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}


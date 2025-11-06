import { NextResponse } from "next/server"
import { getCoinDataBySymbol, syncPricesFromMaster } from "@/lib/mock-coins-service"

// 마지막 동기화 시간 추적 (5초마다 동기화)
let lastSyncTime = 0
const SYNC_INTERVAL = 5000 // 5초

/**
 * GET /api/coins/[symbol]
 * 특정 코인의 상세 정보 가져오기 (모의 데이터)
 * 각 코인의 개별 가격 변동 타이밍을 반영하여 정확한 가격 반환
 * WebSocket 서버 마스터 방식: 필요 시 가격 동기화
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params
    
    // 주기적으로 WebSocket 서버에서 가격 동기화 (5초마다)
    const now = Date.now()
    if (now - lastSyncTime > SYNC_INTERVAL) {
      await syncPricesFromMaster(false) // 캐시가 없을 때만 동기화
      lastSyncTime = now
    }
    
    // 개별 코인 데이터 가져오기 (각 코인의 개별 변동 타이밍 반영)
    const coinData = getCoinDataBySymbol(symbol)

    if (!coinData) {
      return NextResponse.json(
        { error: "Coin not found" },
        { status: 404 }
      )
    }

    // TVL은 시가총액의 일정 비율로 계산
    const tvl = coinData.marketCap * 0.1 // 시가총액의 10% 가정

    // 거래 페이지와 동일한 형식으로 데이터 반환
    const formattedData = {
      id: coinData.id,
      name: coinData.name,
      symbol: coinData.symbol,
      price: coinData.price, // 개별 코인의 현재 가격 (각 코인의 변동 타이밍 반영)
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


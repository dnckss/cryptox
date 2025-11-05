import { NextResponse } from "next/server"
import { getCoinDataBySymbol, getCoinById } from "@/lib/mock-coins-service"
import { getCoinById as getCoinDefinition } from "@/lib/mock-coins"

/**
 * GET /api/coins/[symbol]/chart
 * 특정 코인의 차트 데이터 가져오기 (모의 데이터)
 * Query params:
 * - days: 기간 (1, 7, 14, 30, 90, 180, 365, max) - 기본값: 1
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params
    const { searchParams } = new URL(request.url)
    const days = searchParams.get("days") || "1"
    
    const coinData = getCoinDataBySymbol(symbol)
    if (!coinData) {
      return NextResponse.json(
        { error: "Coin not found" },
        { status: 404 }
      )
    }

    const coinDefinition = getCoinDefinition(coinData.id)
    if (!coinDefinition) {
      return NextResponse.json(
        { error: "Coin definition not found" },
        { status: 404 }
      )
    }

    // days를 숫자로 변환
    const daysNum = days === "max" ? 365 : parseInt(days, 10)
    const dataPoints = Math.min(daysNum * 24, 500) // 최대 500개 데이터 포인트

    // 시드 기반으로 과거 가격 데이터 생성
    const seed = coinData.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    
    // 시드 기반 랜덤 함수
    class SeededRandom {
      private seed: number
      constructor(seed: number) {
        this.seed = seed
      }
      next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280
        return this.seed / 233280
      }
    }

    const prices: number[] = []
    const basePrice = coinDefinition.basePrice
    const volatility = coinDefinition.volatility
    const currentPrice = coinData.price

    // 현재 가격부터 과거로 거슬러 올라가며 가격 생성
    let prevPrice = currentPrice
    for (let i = 0; i < dataPoints; i++) {
      const random = new SeededRandom(seed + i + Math.floor(Date.now() / (1000 * 60 * 60)))
      const timeFactor = (dataPoints - i) / dataPoints // 시간에 따른 트렌드
      const trend = (random.next() - 0.5) * 0.05 * timeFactor // 점진적 트렌드
      const variation = (random.next() - 0.5) * volatility * 0.2 // 랜덤 변동
      
      // 이전 가격을 기준으로 변동
      const price = prevPrice * (1 + trend + variation)
      prevPrice = Math.max(price, basePrice * 0.3) // 최소 30%까지만 하락
      prices.unshift(prevPrice)
    }

    // 현재 가격을 마지막에 추가
    prices.push(currentPrice)

    return NextResponse.json({ data: prices }, { status: 200 })
  } catch (error) {
    console.error("Error fetching coin chart:", error)
    return NextResponse.json(
      { error: "Failed to fetch coin chart", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}


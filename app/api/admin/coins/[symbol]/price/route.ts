import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/utils/admin"
import { setPriceAdjustment } from "@/lib/utils/coin-price-adjust"

/**
 * POST /api/admin/coins/[symbol]/price
 * 관리자 - 코인 가격 조절 (3초 후 적용)
 * Body: {
 *   priceChangePercent: number // 가격 변동 비율 (%)
 * }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const supabase = await createClient()

    // 관리자 권한 체크
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const { symbol } = await params
    const body = await request.json()
    const { priceChangePercent, delaySeconds = 3 } = body

    if (typeof priceChangePercent !== "number") {
      return NextResponse.json(
        { error: "priceChangePercent must be a number" },
        { status: 400 }
      )
    }

    const delay = typeof delaySeconds === "number" ? delaySeconds : parseFloat(delaySeconds) || 3
    if (delay < 0) {
      return NextResponse.json(
        { error: "delaySeconds must be 0 or greater" },
        { status: 400 }
      )
    }

    // 현재 코인 가격 가져오기
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const priceResponse = await fetch(`${baseUrl}/api/coins/${symbol.toLowerCase()}`, {
      cache: "no-store",
    })

    if (!priceResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch current coin price" },
        { status: 500 }
      )
    }

    const priceData = await priceResponse.json()
    const currentPrice = priceData.data?.price || 0

    if (currentPrice <= 0) {
      return NextResponse.json(
        { error: "Invalid current price" },
        { status: 400 }
      )
    }

    // 새 가격 계산
    const newPrice = currentPrice * (1 + priceChangePercent / 100)

    // 가격 조절 비율 저장 (설정한 시간 후 적용)
    setPriceAdjustment(symbol.toLowerCase(), priceChangePercent, delay)

    // 설정한 시간 후 실제 적용 (비동기로 처리)
    const delayMs = delay * 1000
    setTimeout(() => {
      console.log(
        `📈 코인 ${symbol} 가격 변경 적용: ${currentPrice.toLocaleString()} → ${newPrice.toLocaleString()} (${priceChangePercent > 0 ? "+" : ""}${priceChangePercent}%)`
      )
    }, delayMs)

    return NextResponse.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        currentPrice,
        newPrice,
        priceChangePercent,
        delaySeconds: delay,
        appliedAt: new Date(Date.now() + delayMs).toISOString(),
      },
    })
  } catch (error) {
    console.error("Error in POST /api/admin/coins/[symbol]/price:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

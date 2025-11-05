import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/utils/admin"
import { updateCoinPrice } from "@/lib/mock-coins-service"

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
    const { priceChangePercent, delaySeconds = 3, currentPrice, newPrice: providedNewPrice } = body

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

    // 클라이언트에서 전달한 현재 가격과 새 가격 사용 (WebSocket과 일치)
    let finalCurrentPrice = currentPrice
    let finalNewPrice = providedNewPrice

    // 클라이언트에서 전달하지 않았으면 API에서 가져오기 (fallback)
    if (!finalCurrentPrice || finalCurrentPrice <= 0) {
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
      finalCurrentPrice = priceData.data?.price || 0

      if (finalCurrentPrice <= 0) {
        return NextResponse.json(
          { error: "Invalid current price" },
          { status: 400 }
        )
      }
    }

    // 새 가격 계산 (클라이언트에서 전달하지 않았으면 계산)
    if (!finalNewPrice || finalNewPrice <= 0) {
      finalNewPrice = finalCurrentPrice * (1 + priceChangePercent / 100)
    }

    // 즉시 가격 업데이트 (클라이언트에서 이미 지연 시간을 처리했으므로)
    const success = updateCoinPrice(symbol.toLowerCase(), finalNewPrice)
    if (success) {
      console.log(
        `📈 코인 ${symbol} 가격 변경 적용: ${finalCurrentPrice.toLocaleString()} → ${finalNewPrice.toLocaleString()} (${priceChangePercent > 0 ? "+" : ""}${priceChangePercent}%)`
      )
    } else {
      return NextResponse.json(
        { error: "Failed to update coin price" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        currentPrice: finalCurrentPrice,
        newPrice: finalNewPrice,
        priceChangePercent,
        delaySeconds: delay,
        appliedAt: new Date().toISOString(), // 즉시 적용되므로 현재 시간
      },
    })
  } catch (error) {
    console.error("Error in POST /api/admin/coins/[symbol]/price:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

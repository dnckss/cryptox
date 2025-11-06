import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCoinBySymbol, getCoinById } from "@/lib/mock-coins"

/**
 * 사용자 보유 코인 상세 정보 조회 API
 * 현재 가격, 손익 등을 포함한 상세 정보 반환
 * 
 * GET /api/user/holdings/detailed
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 보유 코인 조회
    const { data: holdings, error } = await supabase
      .from("user_coin_holdings")
      .select("*")
      .eq("user_id", user.id)
      .gt("amount", 0) // 수량이 0보다 큰 것만
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch holdings:", error)
      return NextResponse.json({ error: "Failed to fetch holdings" }, { status: 500 })
    }

    if (!holdings || holdings.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    // 각 보유 코인에 대해 현재 가격과 손익 계산
    const detailedHoldings = []

    for (const holding of holdings) {
      const coinId = holding.coin_id
      const amount = Number(holding.amount)
      const averageBuyPrice = Number(holding.average_buy_price)

      if (amount <= 0) continue

      // 코인 기본 정보 가져오기 (가격은 WebSocket에서 받으므로 여기서는 기본 정보만)
      let coin = getCoinBySymbol(coinId)
      
      if (!coin) {
        coin = getCoinById(coinId)
      }

      if (!coin) {
        console.warn(`⚠️ 코인 ${coinId} 정보를 가져올 수 없음`)
        continue
      }

      // 가격은 WebSocket에서 받으므로 여기서는 기본 정보만 반환
      // 클라이언트에서 WebSocket 가격으로 계산하도록 함
      const totalCost = amount * averageBuyPrice

      detailedHoldings.push({
        coinId: coinId,
        coinName: coin.name,
        coinSymbol: coin.symbol,
        amount: amount,
        averageBuyPrice: averageBuyPrice,
        currentPrice: 0, // WebSocket에서 받을 가격 (초기값)
        currentValue: 0, // 클라이언트에서 계산
        totalCost: totalCost,
        profit: 0, // 클라이언트에서 계산
        profitPercent: 0, // 클라이언트에서 계산
      })
    }

    // 정렬은 클라이언트에서 WebSocket 가격으로 계산한 후 수행
    // (API에서는 가격을 계산하지 않으므로 여기서 정렬 불가)

    return NextResponse.json({
      success: true,
      data: detailedHoldings,
    })
  } catch (error) {
    console.error("Error in GET /api/user/holdings/detailed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCoinDataBySymbol, getCoinDataById } from "@/lib/mock-coins-service"

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

      // 현재 코인 가격 가져오기 (심볼 또는 ID로 시도)
      let coinData = getCoinDataBySymbol(coinId)
      
      if (!coinData) {
        coinData = getCoinDataById(coinId)
      }

      if (!coinData || coinData.price <= 0) {
        console.warn(`⚠️ 코인 ${coinId} 가격 정보를 가져올 수 없음`)
        continue
      }

      // 현재 가치와 투자 원금 계산
      const currentPrice = coinData.price
      const currentValue = amount * currentPrice
      const totalCost = amount * averageBuyPrice
      const profit = currentValue - totalCost
      const profitPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0

      detailedHoldings.push({
        coinId: coinId,
        coinName: coinData.name,
        coinSymbol: coinData.symbol,
        amount: amount,
        averageBuyPrice: averageBuyPrice,
        currentPrice: currentPrice,
        currentValue: currentValue,
        totalCost: totalCost,
        profit: profit,
        profitPercent: profitPercent,
      })
    }

    // 손익 기준으로 정렬 (손익이 큰 순서대로)
    detailedHoldings.sort((a, b) => b.profit - a.profit)

    return NextResponse.json({
      success: true,
      data: detailedHoldings,
    })
  } catch (error) {
    console.error("Error in GET /api/user/holdings/detailed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


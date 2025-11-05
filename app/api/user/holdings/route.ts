import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * 사용자 코인 보유량 조회 API
 * 
 * GET /api/user/holdings
 * Query: ?coinId=bitcoin (선택사항, 특정 코인만 조회)
 */
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const coinId = searchParams.get("coinId")

    let query = supabase
      .from("user_coin_holdings")
      .select("*")
      .eq("user_id", user.id)

    if (coinId) {
      query = query.eq("coin_id", coinId)
    }

    const { data: holdings, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch holdings:", error)
      return NextResponse.json({ error: "Failed to fetch holdings" }, { status: 500 })
    }

    // 특정 코인만 조회하는 경우
    if (coinId) {
      if (holdings && holdings.length > 0) {
        return NextResponse.json({
          success: true,
          data: {
            amount: Number(holdings[0].amount),
            averageBuyPrice: Number(holdings[0].average_buy_price),
          },
        })
      } else {
        return NextResponse.json({
          success: true,
          data: {
            amount: 0,
            averageBuyPrice: 0,
          },
        })
      }
    }

    // 전체 보유량 조회
    const formattedHoldings = holdings?.map((holding) => ({
      coinId: holding.coin_id,
      amount: Number(holding.amount),
      averageBuyPrice: Number(holding.average_buy_price),
      createdAt: holding.created_at,
      updatedAt: holding.updated_at,
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedHoldings,
    })
  } catch (error) {
    console.error("Error in GET /api/user/holdings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


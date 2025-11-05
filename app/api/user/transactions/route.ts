import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * 사용자 거래 내역 조회 API
 * 
 * GET /api/user/transactions
 * Query: 
 *   - limit: 조회할 개수 (기본값: 50)
 *   - coinId: 특정 코인만 조회 (선택사항)
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
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const coinId = searchParams.get("coinId")

    let query = supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (coinId) {
      query = query.eq("coin_id", coinId)
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error("Failed to fetch transactions:", error)
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }

    // 데이터 포맷팅
    const formattedTransactions = transactions?.map((tx) => ({
      id: tx.id,
      coinId: tx.coin_id,
      coinName: tx.coin_name,
      coinSymbol: tx.coin_symbol,
      type: tx.transaction_type,
      amount: Number(tx.amount),
      price: Number(tx.price),
      totalValue: Number(tx.total_value),
      averageBuyPrice: tx.average_buy_price ? Number(tx.average_buy_price) : null, // 판매 시 평균 매수가
      createdAt: tx.created_at,
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedTransactions,
      total: formattedTransactions.length,
    })
  } catch (error) {
    console.error("Error in GET /api/user/transactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


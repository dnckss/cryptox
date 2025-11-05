import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * 특정 코인의 모든 사용자 거래 내역 조회 API
 * 
 * GET /api/coins/[symbol]/transactions
 * Query:
 *   - limit: 조회할 개수 (기본값: 20)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const supabase = await createClient()
    const { symbol } = await params

    // 인증 확인 (선택사항 - 모든 사용자가 볼 수 있도록)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20", 10)

    // 해당 코인의 모든 사용자 거래 내역 조회
    // RLS 정책을 우회하기 위해 서비스 역할을 사용하거나, 서버 사이드에서 직접 조회
    // 여기서는 인증된 사용자라면 모든 사용자의 거래를 볼 수 있도록 함
    // coin_symbol로 필터링하여 해당 코인의 거래만 조회
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("coin_symbol", symbol.toUpperCase())
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Failed to fetch transactions:", error)
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    // 데이터 포맷팅
    const formattedTransactions = transactions.map((tx) => ({
      id: tx.id,
      coinId: tx.coin_id,
      coinName: tx.coin_name,
      coinSymbol: tx.coin_symbol,
      type: tx.transaction_type,
      amount: Number(tx.amount),
      price: Number(tx.price),
      totalValue: Number(tx.total_value),
      createdAt: tx.created_at,
    }))

    return NextResponse.json({
      success: true,
      data: formattedTransactions,
      total: formattedTransactions.length,
    })
  } catch (error) {
    console.error("Error in GET /api/coins/[symbol]/transactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


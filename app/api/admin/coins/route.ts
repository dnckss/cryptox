import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/utils/admin"

/**
 * GET /api/admin/coins
 * 관리자 - 코인 목록 조회 (구매 횟수 순 정렬)
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

    // 관리자 권한 체크
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    // 모든 코인 데이터 가져오기 (거래 내역이 없어도 표시)
    const { getAllCoinsData } = await import("@/lib/mock-coins-service")
    const allCoinsData = getAllCoinsData()

    // 코인별 구매 횟수 조회
    const { data: buyTransactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("coin_id, coin_name, coin_symbol")
      .eq("transaction_type", "buy")

    // 코인별 구매 횟수 계산
    const coinPurchaseCount = new Map<string, number>()

    if (!transactionsError && buyTransactions && buyTransactions.length > 0) {
      buyTransactions.forEach((tx) => {
        const key = tx.coin_id.toLowerCase()
        const existing = coinPurchaseCount.get(key) || 0
        coinPurchaseCount.set(key, existing + 1)
      })
    }

    // 모든 코인 데이터에 구매 횟수 추가
    const coinsList = allCoinsData.map((coin) => {
      const purchaseCount = coinPurchaseCount.get(coin.symbol.toLowerCase()) || 0
      return {
        coinId: coin.id,
        coinName: coin.name,
        coinSymbol: coin.symbol,
        count: purchaseCount,
        currentPrice: coin.price,
        change24h: coin.change1d,
      }
    })

    // 구매 횟수 순으로 정렬 (내림차순)
    coinsList.sort((a, b) => b.count - a.count)

    return NextResponse.json({
      success: true,
      data: coinsList,
    })
  } catch (error) {
    console.error("Error in GET /api/admin/coins:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

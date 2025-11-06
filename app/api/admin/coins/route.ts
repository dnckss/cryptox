import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/utils/admin"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { syncPricesFromMaster, getAllCoinsData } from "@/lib/mock-coins-service"

// 마지막 동기화 시간 추적 (5초마다 동기화)
let lastSyncTime = 0
const SYNC_INTERVAL = 5000 // 5초

/**
 * GET /api/admin/coins
 * 관리자 - 코인 목록 조회 (구매 횟수 순 정렬)
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // 인증 확인
    let user = null
    let authError = null
    
    try {
      const authResult = await supabase.auth.getUser()
      user = authResult.data?.user
      authError = authResult.error
    } catch (error) {
      console.error("인증 확인 중 오류:", error)
      authError = error as Error
    }

    if (authError || !user) {
      console.error("인증 실패:", {
        error: authError?.message || "Unknown error",
        hasUser: !!user,
      })
      return NextResponse.json(
        { error: "Unauthorized", details: authError?.message || "Authentication failed" },
        { status: 401 }
      )
    }

    // 관리자 권한 체크 (user_profiles에서 확인)
    const adminEmail = process.env.ADMIN_EMAIL || "cryptoxmanage@gmail.com"
    let isAdminUser = false
    
    try {
      // user_profiles에서 관리자 권한 확인
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .single()

      if (!profileError && profile) {
        isAdminUser = profile.is_admin === true
      } else {
        // 프로필이 없으면 이메일로 확인
        isAdminUser = user.email === adminEmail
      }
    } catch (error) {
      console.error("관리자 권한 확인 중 오류:", error)
      // 프로필 조회 실패 시 이메일로만 확인
      isAdminUser = user.email === adminEmail
    }

    if (!isAdminUser) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    // 주기적으로 WebSocket 서버에서 가격 동기화 (5초마다)
    const now = Date.now()
    if (now - lastSyncTime > SYNC_INTERVAL) {
      await syncPricesFromMaster(false) // 캐시가 없을 때만 동기화
      lastSyncTime = now
    }

    // 모든 코인 데이터 가져오기 (거래 내역이 없어도 표시)
    const allCoinsData = getAllCoinsData()

    // 모든 사용자의 구매 거래 조회 (Service Role Key 사용하여 RLS 우회)
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let buyTransactions: any[] = []
    let transactionsError: any = null
    
    if (supabaseServiceKey) {
      // Service Role Key로 모든 사용자의 거래 조회 (RLS 우회)
      const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseServiceKey
      )
      
      const { data, error } = await adminSupabase
        .from("transactions")
        .select("coin_id, coin_name, coin_symbol")
        .eq("transaction_type", "buy")
      
      transactionsError = error
      if (!error && data) {
        buyTransactions = data
      } else if (error) {
        console.error("구매 거래 조회 오류:", error)
      }
    } else {
      // Service Role Key가 없으면 일반 클라이언트 사용 (RLS 적용됨)
      // 주의: RLS가 활성화되어 있으면 관리자 계정의 거래만 조회될 수 있음
      const { data, error } = await supabase
        .from("transactions")
        .select("coin_id, coin_name, coin_symbol")
        .eq("transaction_type", "buy")
      
      transactionsError = error
      if (!error && data) {
        buyTransactions = data
      } else if (error) {
        console.error("구매 거래 조회 오류:", error)
      }
    }

    // 코인별 구매 횟수 계산 (모든 사용자의 구매 횟수 집계)
    // 거래의 coin_id와 coin_symbol을 모두 확인하여 코인 매칭
    const coinPurchaseCount = new Map<string, number>()

    if (buyTransactions && buyTransactions.length > 0) {
      console.log(`📊 총 ${buyTransactions.length}개의 구매 거래 조회됨`)
      
      buyTransactions.forEach((tx) => {
        // 거래의 coin_id와 coin_symbol을 모두 확인
        const txCoinId = tx.coin_id?.toLowerCase()?.trim() || ""
        const txCoinSymbol = tx.coin_symbol?.toLowerCase()?.trim() || ""
        
        let matched = false
        
        // 모든 코인과 매칭 시도
        for (const coin of allCoinsData) {
          const coinIdLower = coin.id.toLowerCase()
          const coinSymbolLower = coin.symbol.toLowerCase()
          
          // coin_id 또는 coin_symbol로 매칭 (양방향 매칭)
          const isMatch = 
            (txCoinId && (txCoinId === coinIdLower || txCoinId === coinSymbolLower)) ||
            (txCoinSymbol && (txCoinSymbol === coinIdLower || txCoinSymbol === coinSymbolLower))
          
          if (isMatch) {
            // 코인 심볼을 키로 사용 (일관성 위해)
            const key = coin.symbol.toLowerCase()
            const existing = coinPurchaseCount.get(key) || 0
            coinPurchaseCount.set(key, existing + 1)
            matched = true
            break // 매칭되면 중단
          }
        }
        
        // 매칭되지 않은 거래 로깅 (디버깅용)
        if (!matched) {
          console.warn(`⚠️ 매칭되지 않은 거래: coin_id=${tx.coin_id}, coin_symbol=${tx.coin_symbol}`)
        }
      })
      
      console.log(`✅ 코인별 구매 횟수 집계 완료: ${coinPurchaseCount.size}개 코인`)
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

    // 디버깅: 구매 횟수가 0이 아닌 코인 확인
    const coinsWithPurchases = coinsList.filter(c => c.count > 0)
    console.log(`📊 구매 횟수가 있는 코인: ${coinsWithPurchases.length}개`)
    if (coinsWithPurchases.length > 0) {
      console.log("📋 구매 횟수 상위 5개:", coinsWithPurchases.slice(0, 5).map(c => `${c.coinSymbol}: ${c.count}회`))
    }

    return NextResponse.json({
      success: true,
      data: coinsList,
    })
  } catch (error) {
    console.error("Error in GET /api/admin/coins:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

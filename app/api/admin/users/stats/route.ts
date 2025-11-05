import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/utils/admin"
import { getCoinDataBySymbol, getCoinDataById } from "@/lib/mock-coins-service"
import { createClient as createAdminClient } from "@supabase/supabase-js"

/**
 * GET /api/admin/users/stats
 * 관리자 - 사용자 통계 조회
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

    // 모든 사용자 자산 조회
    const { data: allAssets, error: assetsError } = await supabase
      .from("user_assets")
      .select("user_id, balance, initial_balance, created_at")

    if (assetsError) {
      console.error("Failed to fetch user assets:", assetsError)
      return NextResponse.json({ error: "Failed to fetch user assets" }, { status: 500 })
    }

    if (!allAssets || allAssets.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // 관리자 이메일
    const adminEmail = process.env.ADMIN_EMAIL || "cryptoxmanage@gmail.com"

    // 모든 사용자 ID 수집
    const userIds = allAssets.map((asset) => asset.user_id)

    // 사용자 이메일 및 display name 조회
    // 방법 1: Service Role Key로 직접 조회 (가장 확실한 방법)
    // 방법 2: RPC 함수 사용 (RPC 함수가 생성되어 있다면)
    let emailMap = new Map<string, string>()
    let displayNameMap = new Map<string, string>()
    
    try {
      // Service Role Key가 있으면 직접 조회 (가장 확실한 방법)
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log("🔑 Service Role Key 사용하여 사용자 정보 조회 시작...")
        const adminSupabase = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        
        // 각 사용자별로 정보 조회
        for (const userId of userIds) {
          try {
            const { data: user, error } = await adminSupabase.auth.admin.getUserById(userId)
            if (!error && user?.user) {
              if (user.user.email) {
              emailMap.set(userId, user.user.email)
              }
              // display name 조회 (user_metadata에서)
              const displayName = user.user.user_metadata?.display_name || 
                                  user.user.user_metadata?.full_name || 
                                  user.user.user_metadata?.name ||
                                  null
              if (displayName) {
                displayNameMap.set(userId, displayName)
              }
            } else if (error) {
              console.error(`❌ Failed to fetch user info for user ${userId}:`, error)
            }
          } catch (err) {
            console.error(`❌ Error fetching user info for user ${userId}:`, err)
          }
        }
        console.log(`✅ Service Role Key로 ${emailMap.size}개 이메일, ${displayNameMap.size}개 display name 조회 완료`)
      } else {
        // Service Role Key가 없으면 RPC 함수 시도
        console.log("⚠️ SUPABASE_SERVICE_ROLE_KEY가 없습니다. RPC 함수 시도...")
        const { data: userEmails, error: emailError } = await supabase.rpc(
          "get_user_emails",
          { user_ids: userIds }
        )

        if (!emailError && userEmails && Array.isArray(userEmails)) {
          // 이메일 맵 생성
          userEmails.forEach((item: { user_id: string; email: string }) => {
            if (item.user_id && item.email) {
              emailMap.set(item.user_id, item.email)
            }
          })
          console.log(`✅ RPC 함수로 ${emailMap.size}개 이메일 조회 완료`)
        } else if (emailError) {
          console.error("❌ RPC 함수 호출 실패:", emailError)
          console.log("⚠️ 사용자 정보 조회를 위해 SUPABASE_SERVICE_ROLE_KEY를 .env.local에 추가하세요")
        }
      }
    } catch (error) {
      console.error("❌ Error fetching user info:", error)
      // 에러 발생해도 계속 진행 (정보 없이 표시)
    }

    console.log(`📧 최종 사용자 정보: ${emailMap.size}개 이메일, ${displayNameMap.size}개 display name 수집`)

    // 사용자 통계 계산
    const userStats = await Promise.all(
      allAssets.map(async (asset) => {
        const userId = asset.user_id

        // 사용자 프로필 조회
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("nickname, is_admin")
          .eq("user_id", userId)
          .single()

        // 사용자 이메일 및 display name 조회
        const userEmail = emailMap.get(userId) || null
        const displayName = displayNameMap.get(userId) || null
        
        // 디버깅: 사용자 정보 조회 확인
        if (!userEmail && !displayName) {
          console.log(`⚠️ 사용자 정보 없음: userId=${userId}`)
        }

        // 관리자 계정이면 제외 (프로필 기반 또는 이메일 기반)
        if (profile?.is_admin === true) {
          return null
        }

        // 이메일로도 관리자 확인
        if (userEmail === adminEmail) {
          return null
        }

        // 보유 코인 조회
        const { data: holdings, error: holdingsError } = await supabase
          .from("user_coin_holdings")
          .select("coin_id, amount, average_buy_price")
          .eq("user_id", userId)

        let totalCoinValue = 0
        let totalCoinCost = 0
        let coinCount = 0

        if (!holdingsError && holdings) {
          for (const holding of holdings) {
            const coinId = holding.coin_id
            const amount = Number(holding.amount)
            const averageBuyPrice = Number(holding.average_buy_price)

            if (amount > 0) {
              let coinData = getCoinDataBySymbol(coinId)
              if (!coinData) {
                coinData = getCoinDataById(coinId)
              }

              if (coinData && coinData.price > 0) {
                const currentValue = amount * coinData.price
                const cost = amount * averageBuyPrice

                totalCoinValue += currentValue
                totalCoinCost += cost
                coinCount++
              }
            }
          }
        }

        // 충전 내역 조회
        const { data: chargeHistory, error: chargeError } = await supabase
          .from("charge_history")
          .select("virtual_amount, real_price, status")
          .eq("user_id", userId)

        let totalChargedVirtual = 0
        let totalCharged = 0
        if (!chargeError && chargeHistory) {
          chargeHistory.forEach((record) => {
            if (record.status === "approved") {
              totalChargedVirtual += Number(record.virtual_amount)
              totalCharged += Number(record.real_price)
            }
          })
        }

        // 거래 내역 조회 (거래 횟수)
        const { data: transactions, error: transactionsError } = await supabase
          .from("transactions")
          .select("id")
          .eq("user_id", userId)

        const transactionCount = transactionsError ? 0 : (transactions?.length || 0)

        // 총 자산 = 잔고 + 보유 코인 현재 가치
        const totalAssets = Number(asset.balance) + totalCoinValue

        // 총 투자 원금 = 초기 자본 (충전은 이미 initial_balance에 반영됨)
        const totalInvestment = Number(asset.initial_balance)

        // 총 수익 = 총 자산 - 초기 자본
        const totalProfit = totalAssets - totalInvestment

        // 수익률 계산
        const profitRate = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0

        return {
          userId,
          nickname: profile?.nickname || null,
          email: userEmail,
          displayName: displayName || null,
          totalAssets: Math.round(totalAssets),
          totalProfit: Math.round(totalProfit),
          profitRate: Number(profitRate.toFixed(2)),
          balance: Math.round(Number(asset.balance)),
          totalCoinValue: Math.round(totalCoinValue),
          coinCount,
          transactionCount,
          totalCharged: Math.round(totalCharged),
          totalChargedVirtual: Math.round(totalChargedVirtual),
          createdAt: asset.created_at,
        }
      })
    )

    // null 값 제거 (관리자 계정)
    const filteredUserStats = userStats.filter((stat) => stat !== null)

    // 총 자산 기준으로 정렬 (내림차순)
    filteredUserStats.sort((a, b) => b.totalAssets - a.totalAssets)

    return NextResponse.json({
      success: true,
      data: filteredUserStats,
    })
  } catch (error) {
    console.error("Error in GET /api/admin/users/stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


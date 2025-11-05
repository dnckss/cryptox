import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAllCoinsData, getCoinDataById, getCoinDataBySymbol } from "@/lib/mock-coins-service"

/**
 * GET /api/ranking
 * 사용자 랭킹 조회 (총 자산 기준 상위 10명)
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // 인증 확인 (선택사항 - 랭킹은 공개 가능)
    // 모든 사용자의 자산 정보 조회
    const { data: allAssets, error: assetsError } = await supabase
      .from("user_assets")
      .select("user_id, balance, initial_balance")

    if (assetsError) {
      console.error("❌ Failed to fetch user assets:", assetsError)
      console.error("Error details:", JSON.stringify(assetsError, null, 2))
      return NextResponse.json({ 
        error: "Failed to fetch rankings", 
        details: assetsError.message,
        code: assetsError.code 
      }, { status: 500 })
    }

    console.log("✅ Fetched assets:", allAssets?.length || 0, "users")

    if (!allAssets || allAssets.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // 모든 코인 데이터 가져오기 (가격 계산용)
    const allCoinsData = getAllCoinsData()
    const coinsMap = new Map(allCoinsData.map(coin => [coin.id, coin]))

    // 각 사용자의 총 자산 계산
    const rankings = await Promise.all(
      allAssets.map(async (asset) => {
        const userId = asset.user_id

        // 보유 코인 조회
        const { data: holdings, error: holdingsError } = await supabase
          .from("user_coin_holdings")
          .select("coin_id, amount")
          .eq("user_id", userId)

        if (holdingsError) {
          console.error(`❌ Failed to fetch holdings for user ${userId}:`, holdingsError)
        }

        let totalCoinValue = 0
        if (!holdingsError && holdings) {
          for (const holding of holdings) {
            const coinId = holding.coin_id
            const amount = Number(holding.amount)

            if (amount > 0) {
              // 코인 가격 가져오기 (심볼 또는 ID로 시도)
              let coinData = getCoinDataBySymbol(coinId)
              if (!coinData) {
                coinData = getCoinDataById(coinId)
              }

              if (coinData && coinData.price > 0) {
                const currentValue = amount * coinData.price
                totalCoinValue += currentValue
              }
            }
          }
        }

        // 충전 내역 조회
        const { data: chargeHistory, error: chargeError } = await supabase
          .from("charge_history")
          .select("virtual_amount")
          .eq("user_id", userId)

        if (chargeError) {
          console.error(`❌ Failed to fetch charge history for user ${userId}:`, chargeError)
        }

        let totalChargedVirtual = 0
        if (!chargeError && chargeHistory) {
          totalChargedVirtual = chargeHistory.reduce(
            (sum, record) => sum + Number(record.virtual_amount),
            0
          )
        }

        // 총 자산 = 잔고 + 보유 코인 현재 가치
        const totalAssets = Number(asset.balance) + totalCoinValue
        // 총 투자 원금 = 초기 자본 + 충전한 가상 자산
        const totalInvestment = Number(asset.initial_balance) + totalChargedVirtual
        // 총 수익 = 총 자산 - 총 투자 원금
        const totalProfit = totalAssets - totalInvestment

        return {
          userId,
          totalAssets,
          totalProfit,
          balance: Number(asset.balance),
          totalCoinValue,
        }
      })
    )

    // 총 자산 기준으로 정렬 (내림차순)
    rankings.sort((a, b) => b.totalAssets - a.totalAssets)

    // 상위 10명만 선택
    const top10 = rankings.slice(0, 10)

    // 닉네임 조회
    const userIds = top10.map(r => r.userId)
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("user_id, nickname")
      .in("user_id", userIds)

    if (profilesError) {
      console.error("❌ Failed to fetch profiles:", profilesError)
    }

    // 프로필 맵 생성
    const profilesMap = new Map<string, string>()
    if (!profilesError && profiles) {
      profiles.forEach(profile => {
        profilesMap.set(profile.user_id, profile.nickname || "")
      })
    }

    // 랭킹 데이터에 닉네임 추가
    const rankingData = top10.map((rank, index) => {
      const nickname = profilesMap.get(rank.userId) || ""
      // 닉네임이 없으면 "사용자1", "사용자2" 등으로 표시
      const displayName = nickname || `사용자${index + 1}`

      return {
        rank: index + 1,
        userId: rank.userId,
        nickname: displayName,
        totalAssets: Math.round(rank.totalAssets),
        totalProfit: Math.round(rank.totalProfit),
        balance: Math.round(rank.balance),
        totalCoinValue: Math.round(rank.totalCoinValue),
      }
    })

    return NextResponse.json({
      success: true,
      data: rankingData,
    })
  } catch (error) {
    console.error("Error in GET /api/ranking:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


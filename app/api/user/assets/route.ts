import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCoinDataBySymbol, getCoinDataById } from "@/lib/mock-coins-service"

// 사용자 자산 조회
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

    // 사용자 자산 조회
    let { data: assets, error } = await supabase
      .from("user_assets")
      .select("*")
      .eq("user_id", user.id)
      .single()

    // 자산 정보가 없으면 초기 데이터 생성 (첫 로그인)
    if (error && error.code === "PGRST116") {
      const { data: newAssets, error: insertError } = await supabase
        .from("user_assets")
        .insert({
          user_id: user.id,
          balance: 50_000_000, // 초기 자본: 5000만원
          initial_balance: 50_000_000,
          total_charged: 0,
        })
        .select()
        .single()

      if (insertError) {
        console.error("Failed to create user assets:", insertError)
        return NextResponse.json({ error: "Failed to create assets" }, { status: 500 })
      }

      assets = newAssets
    } else if (error) {
      console.error("Failed to fetch user assets:", error)
      return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 })
    }

    // 충전 내역에서 총 충전된 가상 자산 합산 (승인된 것만)
    const { data: chargeHistory, error: chargeError } = await supabase
      .from("charge_history")
      .select("virtual_amount, real_price, status")
      .eq("user_id", user.id)

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

    // 보유 코인 조회 및 현재 가치 계산
    const { data: holdings, error: holdingsError } = await supabase
      .from("user_coin_holdings")
      .select("*")
      .eq("user_id", user.id)

    let totalCoinValue = 0 // 보유 코인 현재 가치
    let totalCoinCost = 0 // 보유 코인 구매 원금 (평균 매수가 기준)
    let coinCount = 0
    
    if (!holdingsError && holdings) {
      for (const holding of holdings) {
        const coinId = holding.coin_id
        const amount = Number(holding.amount)
        const averageBuyPrice = Number(holding.average_buy_price)
        
        if (amount > 0) {
          // 현재 코인 가격 가져오기 (심볼 또는 ID로 시도)
          let coinData = getCoinDataBySymbol(coinId)
          
          // 심볼로 찾지 못하면 ID로 시도
          if (!coinData) {
            coinData = getCoinDataById(coinId)
          }
          
          if (coinData && coinData.price > 0) {
            const currentValue = amount * coinData.price
            const cost = amount * averageBuyPrice // 구매 원금
            
              totalCoinValue += currentValue
              totalCoinCost += cost // 구매 원금 합산
              coinCount++
          } else {
            console.warn(`⚠️ 코인 ${coinId} 가격 정보를 가져올 수 없음`)
          }
        }
      }
    }

    // 총 자산 = 잔고 + 보유 코인 현재 가치
    const totalAssets = Number(assets.balance) + totalCoinValue
    
    // 코인 수익 = 보유 코인 현재 가치 - 보유 코인 구매 원금
    const coinProfit = totalCoinValue - totalCoinCost
    
    // 총 투자 원금 = 초기 자본 (충전은 이미 initial_balance에 반영됨)
    const totalInvestment = Number(assets.initial_balance)
    
    // 총 수익 계산: (총 자산 - 초기 자본)
    // 충전은 초기 자본금 증가로 처리되므로 수익 계산에서 제외
    const totalProfit = totalAssets - totalInvestment
    
    // 보유 코인 손익과 총 수익 일치 확인
    // 차이가 있다면 잔고 변화(판매 수익 등)가 반영된 것
    const profitDifference = totalProfit - coinProfit

    // 디버깅: 계산 과정 확인
    console.log("📊 API 자산 계산:", {
      balance: Number(assets.balance),
      initialBalance: Number(assets.initial_balance),
      totalChargedVirtual,
      totalCoinValue,
      totalCoinCost,
      coinProfit,
      totalAssets,
      totalInvestment,
      totalProfit,
      profitDifference,
    })

    return NextResponse.json({
      success: true,
      data: {
        balance: Number(assets.balance),
        initialBalance: Number(assets.initial_balance),
        totalCharged: totalCharged, // 승인된 충전의 실제 결제 금액
        totalChargedVirtual: totalChargedVirtual, // 승인된 충전의 가상 자산
        totalAssets: totalAssets, // 총 자산 (잔고 + 보유 코인 현재 가치)
        totalCoinValue: totalCoinValue, // 보유 코인 현재 총 가치
        totalCoinCost: totalCoinCost, // 보유 코인 구매 원금 총합
        coinProfit: coinProfit, // 코인 수익 (현재 가치 - 구매 원금)
        coinCount: coinCount, // 보유 코인 종목 수
        totalProfit: totalProfit, // 총 수익 (디버깅용)
      },
    })
  } catch (error) {
    console.error("Error in GET /api/user/assets:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// 자산 업데이트 (충전, 거래 등)
export async function POST(request: Request) {
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

    const body = await request.json()
    const { action, amount, realPrice, packageId, accountInfo } = body

    // 현재 자산 조회
    const { data: currentAssets, error: fetchError } = await supabase
      .from("user_assets")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: "Failed to fetch current assets" }, { status: 500 })
    }

    let newBalance = Number(currentAssets.balance)
    let newTotalCharged = Number(currentAssets.total_charged)

    // 액션에 따라 잔고 업데이트
    if (action === "charge") {
      // 충전은 승인 대기 상태로 저장 (즉시 잔고에 반영하지 않음)
      // 충전 내역 기록 (status: pending, account_info 포함)
      const { error: chargeError } = await supabase.from("charge_history").insert({
        user_id: user.id,
        virtual_amount: amount,
        real_price: realPrice,
        package_id: packageId,
        status: "pending", // 승인 대기
        account_info: accountInfo || null, // 입금자 계좌 정보
      })

      if (chargeError) {
        console.error("Failed to insert charge history:", chargeError)
        return NextResponse.json({ error: "Failed to create charge request" }, { status: 500 })
      }

      // 승인 대기 상태이므로 잔고는 업데이트하지 않음
      // 실제 결제 금액도 아직 총 충전 금액에 포함하지 않음
    } else if (action === "buy" || action === "sell") {
      // 거래 시 잔고 업데이트
      newBalance = action === "buy" ? newBalance - amount : newBalance + amount
      
      if (newBalance < 0) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
      }

      // 자산 업데이트 (거래인 경우)
      const { data: updatedAssets, error: updateError } = await supabase
        .from("user_assets")
        .update({
          balance: newBalance,
          total_charged: newTotalCharged,
        })
        .eq("user_id", user.id)
        .select()
        .single()

      if (updateError) {
        console.error("Failed to update user assets:", updateError)
        return NextResponse.json({ error: "Failed to update assets" }, { status: 500 })
      }

      // 충전 내역에서 총 충전된 가상 자산 합산 (승인된 것만)
      const { data: chargeHistory, error: chargeError } = await supabase
        .from("charge_history")
        .select("virtual_amount, status")
        .eq("user_id", user.id)

      let totalChargedVirtual = 0
      let totalCharged = 0
      if (!chargeError && chargeHistory) {
        chargeHistory.forEach((record) => {
          if (record.status === "approved") {
            totalChargedVirtual += Number(record.virtual_amount)
            // total_charged는 실제 결제 금액이므로 별도 계산 필요
          }
        })
      }

      // 승인된 충전 내역에서 실제 결제 금액 합산
      const { data: approvedCharges, error: approvedError } = await supabase
        .from("charge_history")
        .select("real_price")
        .eq("user_id", user.id)
        .eq("status", "approved")

      if (!approvedError && approvedCharges) {
        totalCharged = approvedCharges.reduce(
          (sum, record) => sum + Number(record.real_price),
          0
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          balance: Number(updatedAssets.balance),
          initialBalance: Number(updatedAssets.initial_balance),
          totalCharged: totalCharged,
          totalChargedVirtual: totalChargedVirtual,
        },
      })
    }

    // 충전 신청의 경우 (승인 대기 상태)
    return NextResponse.json({
      success: true,
      data: {
        message: "충전 신청이 완료되었습니다. 입금 확인까지 대기 중입니다.",
        status: "pending",
      },
    })
  } catch (error) {
    console.error("Error in POST /api/user/assets:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


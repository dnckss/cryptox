import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * 거래 API 엔드포인트
 * 
 * POST /api/trade
 * Body: {
 *   type: "buy" | "sell",
 *   coinId: string,
 *   coinName: string,
 *   coinSymbol: string,
 *   amount: number, // 구매 시: 원화 금액, 판매 시: 코인 수량
 *   price: number, // 현재 코인 가격
 * }
 */
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
    const { type, coinId, coinName, coinSymbol, amount, price } = body

    // 입력 검증
    if (!type || !coinId || !coinName || !coinSymbol || !amount || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (type !== "buy" && type !== "sell") {
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 })
    }

    if (amount <= 0 || price <= 0) {
      return NextResponse.json({ error: "Amount and price must be positive" }, { status: 400 })
    }

    // 현재 자산 조회
    const { data: currentAssets, error: assetsError } = await supabase
      .from("user_assets")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (assetsError || !currentAssets) {
      return NextResponse.json({ error: "Failed to fetch user assets" }, { status: 500 })
    }

    const currentBalance = Number(currentAssets.balance)

    if (type === "buy") {
      // 구매 로직
      const totalCost = amount // 원화 금액

      // 잔고 확인
      if (currentBalance < totalCost) {
        return NextResponse.json(
          { error: "Insufficient balance", available: currentBalance },
          { status: 400 }
        )
      }

      // 코인 수량 계산
      const coinAmount = amount / price

      // 코인 보유량 조회 또는 생성
      const { data: existingHolding, error: holdingError } = await supabase
        .from("user_coin_holdings")
        .select("*")
        .eq("user_id", user.id)
        .eq("coin_id", coinId)
        .single()

      let newAmount: number
      let newAveragePrice: number

      if (existingHolding) {
        // 기존 보유량이 있는 경우: 평균 매수가 재계산
        const existingAmount = Number(existingHolding.amount)
        const existingAvgPrice = Number(existingHolding.average_buy_price)

        const totalExistingValue = existingAmount * existingAvgPrice
        const newPurchaseValue = coinAmount * price
        const totalValue = totalExistingValue + newPurchaseValue
        const totalAmount = existingAmount + coinAmount

        newAmount = totalAmount
        newAveragePrice = totalValue / totalAmount
      } else {
        // 첫 구매
        newAmount = coinAmount
        newAveragePrice = price
      }

      // 트랜잭션 시작 (Supabase는 자동 트랜잭션을 지원하지 않으므로, 순차적으로 처리)
      // 1. 잔고 차감 (정수로 변환)
      const newBalance = Math.round(currentBalance - totalCost)
      const { error: balanceError } = await supabase
        .from("user_assets")
        .update({
          balance: newBalance,
        })
        .eq("user_id", user.id)

      if (balanceError) {
        console.error("Failed to update balance:", balanceError)
        return NextResponse.json({ error: "Failed to update balance" }, { status: 500 })
      }

      // 2. 코인 보유량 업데이트
      if (existingHolding) {
        const { error: updateError } = await supabase
          .from("user_coin_holdings")
          .update({
            amount: newAmount,
            average_buy_price: newAveragePrice,
          })
          .eq("user_id", user.id)
          .eq("coin_id", coinId)

        if (updateError) {
          console.error("Failed to update holdings:", updateError)
          // 롤백: 잔고 복구 (정수로 변환)
          await supabase
            .from("user_assets")
            .update({ balance: Math.round(currentBalance) })
            .eq("user_id", user.id)
          return NextResponse.json({ error: "Failed to update holdings" }, { status: 500 })
        }
      } else {
        const { error: insertError } = await supabase
          .from("user_coin_holdings")
          .insert({
            user_id: user.id,
            coin_id: coinId,
            amount: newAmount,
            average_buy_price: newAveragePrice,
          })

        if (insertError) {
          console.error("Failed to insert holdings:", insertError)
          // 롤백: 잔고 복구 (정수로 변환)
          await supabase
            .from("user_assets")
            .update({ balance: Math.round(currentBalance) })
            .eq("user_id", user.id)
          return NextResponse.json({ error: "Failed to create holdings" }, { status: 500 })
        }
      }

      // 3. 거래 내역 저장
      const { error: transactionError } = await supabase.from("transactions").insert({
        user_id: user.id,
        coin_id: coinId,
        coin_name: coinName,
        coin_symbol: coinSymbol,
        transaction_type: "buy",
        amount: coinAmount,
        price: price,
        total_value: Math.round(totalCost), // 정수로 변환
      })

      if (transactionError) {
        console.error("Failed to save transaction:", transactionError)
        // 거래 내역 저장 실패는 치명적이지 않으므로 경고만
      }

      // 업데이트된 잔고 조회
      const { data: updatedAssets } = await supabase
        .from("user_assets")
        .select("balance")
        .eq("user_id", user.id)
        .single()

      return NextResponse.json({
        success: true,
        data: {
          type: "buy",
          coinAmount: coinAmount,
          totalCost: totalCost,
          newBalance: Number(updatedAssets?.balance || currentBalance - totalCost),
          holdings: {
            amount: newAmount,
            averagePrice: newAveragePrice,
          },
        },
      })
    } else {
      // 판매 로직
      const coinAmount = amount // 판매할 코인 수량
      const totalValue = Math.round(coinAmount * price) // 받을 원화 금액 (정수로 변환)

      // 코인 보유량 확인
      const { data: existingHolding, error: holdingError } = await supabase
        .from("user_coin_holdings")
        .select("*")
        .eq("user_id", user.id)
        .eq("coin_id", coinId)
        .single()

      if (holdingError || !existingHolding) {
        return NextResponse.json(
          { error: "You don't own this coin" },
          { status: 400 }
        )
      }

      const currentHolding = Number(existingHolding.amount)

      // 보유량 확인
      if (currentHolding < coinAmount) {
        return NextResponse.json(
          {
            error: "Insufficient coin balance",
            available: currentHolding,
          },
          { status: 400 }
        )
      }

      // 잔고 증가 (정수로 변환)
      const newBalance = Math.round(currentBalance + totalValue)
      const { error: balanceError } = await supabase
        .from("user_assets")
        .update({
          balance: newBalance,
        })
        .eq("user_id", user.id)

      if (balanceError) {
        console.error("Failed to update balance:", balanceError)
        return NextResponse.json({ error: "Failed to update balance" }, { status: 500 })
      }

      // 코인 보유량 차감
      const newAmount = currentHolding - coinAmount

      if (newAmount > 0) {
        // 일부만 판매: 보유량만 업데이트 (평균 매가는 유지)
        const { error: updateError } = await supabase
          .from("user_coin_holdings")
          .update({
            amount: newAmount,
          })
          .eq("user_id", user.id)
          .eq("coin_id", coinId)

        if (updateError) {
          console.error("Failed to update holdings:", updateError)
          // 롤백: 잔고 복구 (정수로 변환)
          await supabase
            .from("user_assets")
            .update({ balance: Math.round(currentBalance) })
            .eq("user_id", user.id)
          return NextResponse.json({ error: "Failed to update holdings" }, { status: 500 })
        }
      } else {
        // 전부 판매: 보유량 레코드 삭제
        const { error: deleteError } = await supabase
          .from("user_coin_holdings")
          .delete()
          .eq("user_id", user.id)
          .eq("coin_id", coinId)

        if (deleteError) {
          console.error("Failed to delete holdings:", deleteError)
          // 롤백: 잔고 복구 (정수로 변환)
          await supabase
            .from("user_assets")
            .update({ balance: Math.round(currentBalance) })
            .eq("user_id", user.id)
          return NextResponse.json({ error: "Failed to delete holdings" }, { status: 500 })
        }
      }

      // 거래 내역 저장 (판매 시 평균 매수가 포함)
      const averageBuyPrice = Number(existingHolding.average_buy_price)
      
      // 디버깅: 판매 정보 확인
      console.log("💰 판매 거래 저장:", {
        coinId,
        coinSymbol,
        coinAmount,
        sellPrice: price,
        averageBuyPrice,
        totalValue: Math.round(totalValue),
        expectedProfit: (price - averageBuyPrice) * coinAmount,
      })
      
      const { error: transactionError } = await supabase.from("transactions").insert({
        user_id: user.id,
        coin_id: coinId,
        coin_name: coinName,
        coin_symbol: coinSymbol,
        transaction_type: "sell",
        amount: coinAmount,
        price: price,
        total_value: Math.round(totalValue), // 정수로 변환
        average_buy_price: averageBuyPrice, // 판매 시 평균 매수가 저장
      })

      if (transactionError) {
        console.error("Failed to save transaction:", transactionError)
      }

      // 업데이트된 잔고 조회
      const { data: updatedAssets } = await supabase
        .from("user_assets")
        .select("balance")
        .eq("user_id", user.id)
        .single()

      return NextResponse.json({
        success: true,
        data: {
          type: "sell",
          coinAmount: coinAmount,
          totalValue: totalValue,
          newBalance: Number(updatedAssets?.balance || currentBalance + totalValue),
          remainingHolding: newAmount,
        },
      })
    }
  } catch (error) {
    console.error("Error in POST /api/trade:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


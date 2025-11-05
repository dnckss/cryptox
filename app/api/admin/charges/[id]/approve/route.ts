import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/utils/admin"

/**
 * POST /api/admin/charges/[id]/approve
 * 관리자 - 충전 신청 승인
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // 충전 신청 조회 (관리자용 - 모든 사용자의 충전 내역 조회 가능)
    const { data: charge, error: fetchError } = await supabase
      .from("charge_history")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Failed to fetch charge:", fetchError)
      console.error("Error details:", JSON.stringify(fetchError, null, 2))
      return NextResponse.json({ 
        error: "Charge not found",
        details: fetchError.message,
        code: fetchError.code
      }, { status: 404 })
    }

    if (!charge) {
      return NextResponse.json({ error: "Charge not found" }, { status: 404 })
    }

    if (charge.status !== "pending") {
      return NextResponse.json(
        { error: "Charge is not in pending status" },
        { status: 400 }
      )
    }

    // 사용자 자산 조회
    const { data: assets, error: assetsError } = await supabase
      .from("user_assets")
      .select("*")
      .eq("user_id", charge.user_id)
      .single()

    if (assetsError) {
      return NextResponse.json({ error: "Failed to fetch user assets" }, { status: 500 })
    }

    // 잔고에 가상 자산 추가
    const newBalance = Number(assets.balance) + Number(charge.virtual_amount)
    const newTotalCharged = Number(assets.total_charged) + Number(charge.real_price)
    // 충전은 초기 자본금 증가로 처리 (수익이 아님)
    const newInitialBalance = Number(assets.initial_balance) + Number(charge.virtual_amount)

    // 자산 업데이트
    const { error: updateAssetsError } = await supabase
      .from("user_assets")
      .update({
        balance: newBalance,
        total_charged: newTotalCharged,
        initial_balance: newInitialBalance, // 초기 자본금 증가
      })
      .eq("user_id", charge.user_id)

    if (updateAssetsError) {
      console.error("Failed to update user assets:", updateAssetsError)
      return NextResponse.json({ error: "Failed to update assets" }, { status: 500 })
    }

    // 충전 내역 상태를 approved로 업데이트
    const { error: updateChargeError, data: updatedCharge } = await supabase
      .from("charge_history")
      .update({
        status: "approved",
      })
      .eq("id", id)
      .select()

    if (updateChargeError) {
      console.error("Failed to update charge status:", updateChargeError)
      console.error("Update error details:", JSON.stringify(updateChargeError, null, 2))
      return NextResponse.json({ 
        error: "Failed to update charge status",
        details: updateChargeError.message,
        code: updateChargeError.code
      }, { status: 500 })
    }

    if (!updatedCharge || updatedCharge.length === 0) {
      console.error("No rows updated")
      return NextResponse.json({ error: "No rows updated" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Charge approved successfully",
    })
  } catch (error) {
    console.error("Error in POST /api/admin/charges/[id]/approve:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


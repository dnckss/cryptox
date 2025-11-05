import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/utils/admin"

/**
 * POST /api/admin/charges/[id]/reject
 * 관리자 - 충전 신청 거절
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
    const body = await request.json()
    const { note } = body // 거절 사유 (선택사항)

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

    // 충전 내역 상태를 rejected로 업데이트
    const { error: updateChargeError, data: updatedCharge } = await supabase
      .from("charge_history")
      .update({
        status: "rejected",
        admin_note: note || null, // 거절 사유 저장
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
      message: "Charge rejected successfully",
    })
  } catch (error) {
    console.error("Error in POST /api/admin/charges/[id]/reject:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


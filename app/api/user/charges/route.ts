import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/user/charges
 * 사용자 충전 내역 조회
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

    // 충전 내역 조회
    const { data: charges, error } = await supabase
      .from("charge_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch charges:", error)
      return NextResponse.json({ error: "Failed to fetch charges" }, { status: 500 })
    }

    // 데이터 포맷팅
    const formattedCharges = charges?.map((charge) => ({
      id: charge.id,
      virtualAmount: Number(charge.virtual_amount),
      realPrice: Number(charge.real_price),
      packageId: charge.package_id,
      status: charge.status || "pending",
      accountInfo: charge.account_info || "",
      adminNote: charge.admin_note || "",
      createdAt: charge.created_at,
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedCharges,
    })
  } catch (error) {
    console.error("Error in GET /api/user/charges:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


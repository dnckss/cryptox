import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/utils/admin"

/**
 * GET /api/admin/charges
 * 관리자 - 충전 신청 목록 조회
 */
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "pending" // 기본값: pending (승인 대기)

    // 충전 신청 목록 조회
    let query = supabase
      .from("charge_history")
      .select(`
        id,
        user_id,
        virtual_amount,
        real_price,
        package_id,
        status,
        account_info,
        admin_note,
        created_at
      `)
      .order("created_at", { ascending: false })

    // 상태 필터링
    if (status !== "all") {
      query = query.eq("status", status)
    }

    const { data: charges, error } = await query

    if (error) {
      console.error("Failed to fetch charges:", error)
      return NextResponse.json({ error: "Failed to fetch charges" }, { status: 500 })
    }

    if (!charges || charges.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    // 사용자 프로필 조회 (별도 쿼리)
    const userIds = charges.map((c: any) => c.user_id)
    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("user_id, nickname")
      .in("user_id", userIds)

    // 프로필 맵 생성
    const profilesMap = new Map<string, string>()
    if (!profilesError && profiles) {
      profiles.forEach((profile: any) => {
        profilesMap.set(profile.user_id, profile.nickname || "")
      })
    }

    // 데이터 포맷팅
    const formattedCharges = charges.map((charge: any) => {
      const nickname = profilesMap.get(charge.user_id) || ""
      const displayName = nickname || `사용자${charge.user_id.slice(0, 8)}`

      return {
        id: charge.id,
        userId: charge.user_id,
        userName: displayName,
        virtualAmount: Number(charge.virtual_amount),
        realPrice: Number(charge.real_price),
        packageId: charge.package_id,
        status: charge.status,
        accountInfo: charge.account_info || "",
        adminNote: charge.admin_note || "",
        createdAt: charge.created_at,
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: formattedCharges,
    })
  } catch (error) {
    console.error("Error in GET /api/admin/charges:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


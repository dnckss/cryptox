import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/utils/admin"

/**
 * GET /api/user/admin-status
 * 현재 사용자의 관리자 여부 확인
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

    // 관리자 권한 확인
    const admin = await isAdmin()

    return NextResponse.json({
      success: true,
      data: {
        isAdmin: admin,
      },
    })
  } catch (error) {
    console.error("Error in GET /api/user/admin-status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


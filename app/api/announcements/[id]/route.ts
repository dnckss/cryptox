import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/utils/admin"
import { createClient as createAdminClient } from "@supabase/supabase-js"

/**
 * DELETE /api/announcements/[id]
 * 공지 삭제 (관리자만)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // 관리자 권한 체크
    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // 공지 삭제 (Service Role Key 사용하여 RLS 우회)
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let error

    if (supabaseServiceKey) {
      // Service Role Key로 RLS 우회하여 공지 삭제
      const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseServiceKey
      )

      const result = await adminSupabase
        .from("announcements")
        .delete()
        .eq("id", id)

      error = result.error
    } else {
      // Service Role Key가 없으면 일반 클라이언트 사용
      const result = await supabase
        .from("announcements")
        .delete()
        .eq("id", id)

      error = result.error
    }

    if (error) {
      console.error("Error deleting announcement:", error)
      return NextResponse.json(
        { error: "Failed to delete announcement" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Announcement deleted successfully",
    })
  } catch (error) {
    console.error("Error in DELETE /api/announcements/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


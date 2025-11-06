import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/announcements/latest
 * 최신 공지 조회 (알림용)
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

    // 가장 최근 공지 조회
    const { data: announcement, error } = await supabase
      .from("announcements")
      .select("id, title, content, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // 공지가 없으면 null 반환
      if (error.code === "PGRST116") {
        return NextResponse.json({
          success: true,
          data: null,
        })
      }
      console.error("Error fetching latest announcement:", error)
      return NextResponse.json(
        { error: "Failed to fetch latest announcement" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: announcement,
    })
  } catch (error) {
    console.error("Error in GET /api/announcements/latest:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


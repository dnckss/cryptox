import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * PATCH /api/announcements/[id]/view
 * 공지 조회 횟수 증가 (중복 조회 방지)
 */
export async function PATCH(
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

    const { id } = await params

    // 이미 조회한 기록이 있는지 확인
    const { data: existingView } = await supabase
      .from("announcement_views")
      .select("id")
      .eq("announcement_id", id)
      .eq("user_id", user.id)
      .single()

    // 이미 조회한 경우 조회 횟수 증가하지 않음
    if (existingView) {
      return NextResponse.json({
        success: true,
        data: { alreadyViewed: true },
      })
    }

    // 조회 기록 추가
    const { error: viewError } = await supabase
      .from("announcement_views")
      .insert({
        announcement_id: id,
        user_id: user.id,
      })

    if (viewError) {
      console.error("Error creating view record:", viewError)
      // 조회 기록 추가 실패해도 계속 진행
    }

    // 현재 조회수 가져오기
    const { data: currentAnnouncement, error: fetchError } = await supabase
      .from("announcements")
      .select("view_count")
      .eq("id", id)
      .single()

    if (fetchError || !currentAnnouncement) {
      console.error("Error fetching announcement:", fetchError)
      return NextResponse.json(
        { error: "Failed to fetch announcement" },
        { status: 500 }
      )
    }

    // 조회 횟수 증가
    const { data: announcement, error } = await supabase
      .from("announcements")
      .update({ view_count: (currentAnnouncement.view_count || 0) + 1 })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating view count:", error)
      return NextResponse.json(
        { error: "Failed to update view count" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: announcement,
    })
  } catch (error) {
    console.error("Error in PATCH /api/announcements/[id]/view:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


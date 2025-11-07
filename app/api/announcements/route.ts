import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/utils/admin"
import { createClient as createAdminClient } from "@supabase/supabase-js"

/**
 * GET /api/announcements
 * 공지 목록 조회 (활성화된 공지만)
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

    // 활성화된 공지 목록 조회 (최신순)
    const { data: announcements, error } = await supabase
      .from("announcements")
      .select(`
        id,
        title,
        content,
        author_id,
        view_count,
        is_active,
        created_at,
        updated_at
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching announcements:", error)
      return NextResponse.json(
        { error: "Failed to fetch announcements" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: announcements || [],
    })
  } catch (error) {
    console.error("Error in GET /api/announcements:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/announcements
 * 공지 작성 (관리자만)
 */
export async function POST(request: Request) {
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

    const body = await request.json()
    const { title, content } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    // 공지 작성 (Service Role Key 사용하여 RLS 우회)
    // Vercel에서는 RLS 정책이 엄격하게 적용되므로 Service Role Key를 항상 사용
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseServiceKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not set")
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    // Service Role Key로 RLS 우회하여 공지 작성
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseServiceKey
    )

    const { data: announcement, error } = await adminSupabase
      .from("announcements")
      .insert({
        title: title.trim(),
        content: content.trim(),
        author_id: user.id,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating announcement:", error)
      return NextResponse.json(
        { error: "Failed to create announcement" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: announcement,
    })
  } catch (error) {
    console.error("Error in POST /api/announcements:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


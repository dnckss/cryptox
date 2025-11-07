import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/utils/admin"
import { createClient as createAdminClient } from "@supabase/supabase-js"

/**
 * GET /api/inquiries
 * 문의 목록 조회
 * - 사용자: 자신의 문의만 조회
 * - 관리자: 모든 문의 조회
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

    // 관리자 여부 확인
    const admin = await isAdmin()

    let inquiries: any[] | null = null
    let error = null
    let adminSupabase: ReturnType<typeof createAdminClient> | null = null

    if (admin) {
      // 관리자는 Service Role Key를 사용하여 모든 문의 조회 (RLS 우회)
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      if (supabaseServiceKey) {
        adminSupabase = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          supabaseServiceKey
        )

        const result = await adminSupabase
          .from("inquiries")
          .select(`
            id,
            user_id,
            title,
            content,
            status,
            admin_response,
            admin_id,
            answered_at,
            created_at,
            updated_at
          `)
          .order("created_at", { ascending: false })

        inquiries = result.data
        error = result.error
      } else {
        // Service Role Key가 없으면 일반 클라이언트 사용 (RLS 정책에 의존)
        const result = await supabase
          .from("inquiries")
          .select(`
            id,
            user_id,
            title,
            content,
            status,
            admin_response,
            admin_id,
            answered_at,
            created_at,
            updated_at
          `)
          .order("created_at", { ascending: false })

        inquiries = result.data
        error = result.error
      }
    } else {
      // 사용자는 자신의 문의만 조회
      const result = await supabase
        .from("inquiries")
        .select(`
          id,
          user_id,
          title,
          content,
          status,
          admin_response,
          admin_id,
          answered_at,
          created_at,
          updated_at
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      inquiries = result.data
      error = result.error
    }

    if (error) {
      console.error("Error fetching inquiries:", error)
      return NextResponse.json(
        { error: "Failed to fetch inquiries" },
        { status: 500 }
      )
    }

    let enrichedInquiries = Array.isArray(inquiries) ? inquiries : []

    if (enrichedInquiries.length > 0) {
      if (admin && adminSupabase) {
        const userIds = Array.from(
          new Set(
            enrichedInquiries
              .map((inquiry) => inquiry.user_id)
              .filter((id): id is string => typeof id === "string")
          )
        )

        if (userIds.length > 0) {
          const {
            data: profiles,
            error: profileError,
          } = await adminSupabase
            .from("user_profiles")
            .select("user_id, nickname")
            .in("user_id", userIds)

          if (profileError) {
            // Error fetching user profiles
          }

          const profileMap = new Map<string, string | null>()
          if (profiles && Array.isArray(profiles)) {
            profiles.forEach((profile: { user_id: string; nickname: string | null }) => {
              profileMap.set(
                profile.user_id,
                typeof profile.nickname === "string" ? profile.nickname : null
              )
            })
          }

          enrichedInquiries = enrichedInquiries.map((inquiry) => ({
            ...inquiry,
            userNickname: profileMap.get(inquiry.user_id) ?? null,
          }))
        } else {
          enrichedInquiries = enrichedInquiries.map((inquiry) => ({
            ...inquiry,
            userNickname: null,
          }))
        }
      } else if (!admin) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("nickname")
          .eq("user_id", user.id)
          .single()

        const nickname =
          profile && typeof profile.nickname === "string" ? profile.nickname : null

        enrichedInquiries = enrichedInquiries.map((inquiry) => ({
          ...inquiry,
          userNickname: inquiry.user_id === user.id ? nickname : null,
        }))
      } else {
        enrichedInquiries = enrichedInquiries.map((inquiry) => ({
          ...inquiry,
          userNickname: null,
        }))
      }
    }

    return NextResponse.json({
      success: true,
      data: enrichedInquiries,
    })
  } catch (error) {
    console.error("Error in GET /api/inquiries:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inquiries
 * 문의 작성 (사용자만)
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
    const { title, content } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    // 문의 작성
    const { data: inquiry, error } = await supabase
      .from("inquiries")
      .insert({
        title: title.trim(),
        content: content.trim(),
        user_id: user.id,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating inquiry:", error)
      return NextResponse.json(
        { error: "Failed to create inquiry" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: inquiry,
    })
  } catch (error) {
    console.error("Error in POST /api/inquiries:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/utils/admin"
import { createClient as createAdminClient } from "@supabase/supabase-js"

/**
 * PATCH /api/inquiries/[id]
 * 문의 답변 (관리자만)
 */
export async function PATCH(
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
    const body = await request.json()
    const { admin_response, status } = body

    if (!admin_response || !admin_response.trim()) {
      return NextResponse.json(
        { error: "Admin response is required" },
        { status: 400 }
      )
    }

    // 문의 답변 업데이트 (Service Role Key 사용하여 RLS 우회)
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseServiceKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not set")
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseServiceKey
    )

    const { data: inquiry, error } = await adminSupabase
      .from("inquiries")
      .update({
        admin_response: admin_response.trim(),
        admin_id: user.id,
        status: status || "answered",
        answered_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating inquiry:", error)
      return NextResponse.json(
        { error: "Failed to update inquiry" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: inquiry,
    })
  } catch (error) {
    console.error("Error in PATCH /api/inquiries/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


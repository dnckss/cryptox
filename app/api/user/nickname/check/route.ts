import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * 닉네임 중복 체크 API
 * GET /api/user/nickname/check?nickname=test
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      )
    }

    // 쿼리 파라미터에서 닉네임 가져오기
    const { searchParams } = new URL(request.url)
    const nickname = searchParams.get('nickname')?.trim()

    if (!nickname) {
      return NextResponse.json(
        { success: false, error: "닉네임을 입력해주세요." },
        { status: 400 }
      )
    }

    // 현재 사용자의 기존 닉네임 확인
    const { data: currentProfile } = await supabase
      .from("user_profiles")
      .select("nickname")
      .eq("user_id", user.id)
      .single()

    // 현재 사용자의 기존 닉네임과 동일하면 중복 체크 통과
    if (currentProfile?.nickname === nickname) {
      return NextResponse.json({
        success: true,
        available: true,
        message: "사용 가능한 닉네임입니다."
      })
    }

    // 다른 사용자가 동일한 닉네임을 사용하는지 확인
    const { data: existingProfile, error: checkError } = await supabase
      .from("user_profiles")
      .select("user_id")
      .eq("nickname", nickname)
      .single()

    if (checkError && checkError.code === "PGRST116") {
      // 중복 없음 (PGRST116 = no rows returned)
      return NextResponse.json({
        success: true,
        available: true,
        message: "사용 가능한 닉네임입니다."
      })
    }

    if (existingProfile) {
      // 중복 발견
      return NextResponse.json({
        success: true,
        available: false,
        message: "이미 사용 중인 닉네임입니다."
      })
    }

    // 예상치 못한 오류
    return NextResponse.json(
      { success: false, error: "닉네임 확인 중 오류가 발생했습니다." },
      { status: 500 }
    )
  } catch (error) {
    console.error("닉네임 중복 체크 오류:", error)
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}


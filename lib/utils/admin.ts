import { createClient } from "@/lib/supabase/server"

/**
 * 현재 사용자가 관리자인지 확인
 * @returns 관리자 여부
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return false
    }

    // user_profiles에서 관리자 권한 확인
    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single()

    if (error || !profile) {
      // 프로필이 없으면 이메일로 확인 (환경 변수에 설정된 관리자 이메일)
      const adminEmail = process.env.ADMIN_EMAIL || "cryptoxmanage@gmail.com"
      return user.email === adminEmail
    }

    return profile.is_admin === true
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

/**
 * 관리자 권한 체크 (API 라우트용)
 * 관리자가 아니면 에러 응답 반환
 */
export async function requireAdmin() {
  const admin = await isAdmin()
  if (!admin) {
    throw new Error("Forbidden: Admin access required")
  }
}


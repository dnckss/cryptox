import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/utils/admin'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // 현재 요청의 origin 사용 (Vercel 또는 localhost)
  const origin = requestUrl.origin
  let next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error("Code exchange error:", exchangeError)
      return NextResponse.redirect(new URL('/?error=auth_failed', origin))
    }

    // 사용자 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser()
    
    // 로그인 직후 사용자 자산이 없으면 초기 자산 생성 (5000만원)
    if (user) {
      const { data: existingAssets, error: fetchError } = await supabase
        .from("user_assets")
        .select("id")
        .eq("user_id", user.id)
        .single()

      // 자산이 없으면 생성 (첫 로그인)
      if (fetchError && fetchError.code === "PGRST116") {
        await supabase.from("user_assets").insert({
          user_id: user.id,
          balance: 50_000_000, // 초기 자본: 5000만원
          initial_balance: 50_000_000,
          total_charged: 0,
        })
      }

      // 관리자 계정이면 충전 관리 페이지로 리다이렉트
      const admin = await isAdmin()
      if (admin) {
        next = '/dashboard/admin/charges'
      }
    }
  }

  // 절대 URL로 리다이렉트 (현재 요청의 origin 사용)
  return NextResponse.redirect(new URL(next, origin))
}


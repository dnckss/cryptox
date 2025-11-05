import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)
    
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
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}


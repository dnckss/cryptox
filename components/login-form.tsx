"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup } from "@/components/ui/field"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSocialLogin = async (provider: "google" | "apple" | "kakao") => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error("로그인 오류:", error)
        alert("로그인에 실패했습니다. 다시 시도해주세요.")
      }
    } catch (err) {
      console.error("로그인 오류:", err)
      alert("로그인에 실패했습니다. 다시 시도해주세요.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-transparent border-primary">
        <CardHeader>
          <CardTitle className="text-white">cryptoX 로그인</CardTitle>
          <CardDescription className="text-gray-400">
            소셜 계정으로 로그인하여 시작하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <FieldGroup>
              <Field>
                <Button
                  type="button"
                  onClick={() => handleSocialLogin("google")}
                  disabled={loading}
                  variant="outline"
                  className="w-full bg-transparent border-primary text-primary hover:bg-primary/10"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google로 로그인
                </Button>
              </Field>
              <Field>
                <Button
                  type="button"
                  onClick={() => handleSocialLogin("apple")}
                  disabled={loading}
                  variant="outline"
                  className="w-full bg-transparent border-primary text-primary hover:bg-primary/10"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  Apple로 로그인
                </Button>
              </Field>
              <Field>
                <Button
                  type="button"
                  onClick={() => handleSocialLogin("kakao")}
                  disabled={loading}
                  variant="outline"
                  className="w-full bg-transparent border-primary text-primary hover:bg-primary/10"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.48 3 2 6.11 2 10c0 2.45 2.06 4.57 5 5.85L6 21l5.5-3h.5c5.52 0 10-3.11 10-7s-4.48-7-10-7z" />
                  </svg>
                  Kakao로 로그인
                </Button>
              </Field>
              {loading && (
                <Field>
                  <p className="text-center text-sm text-gray-400">
                    로그인 중...
                  </p>
                </Field>
              )}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

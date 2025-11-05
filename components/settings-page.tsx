"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { User, Bell, Moon, Sun, Globe } from "lucide-react"

export function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [nickname, setNickname] = useState("")
  const [originalNickname, setOriginalNickname] = useState("") // 원본 닉네임 저장 (중복 체크용)
  const [email, setEmail] = useState("")
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [language, setLanguage] = useState("ko")
  const [nicknameError, setNicknameError] = useState("")
  const [checkingNickname, setCheckingNickname] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient()
        
        // 현재 사용자 정보 가져오기
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          console.error("사용자 정보 로드 실패:", userError)
          return
        }

        setEmail(user.email || "")

        // 프로필 정보 가져오기
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("nickname")
          .eq("user_id", user.id)
          .single()

        if (profileError) {
          // 프로필이 없으면 (PGRST116) 새로 생성
          if (profileError.code === "PGRST116") {
            // 프로필이 없으면 빈 닉네임으로 시작
            setNickname("")
          } else {
            console.error("프로필 로드 실패:", profileError)
          }
        } else if (profile) {
          const savedNickname = profile.nickname || ""
          setNickname(savedNickname)
          setOriginalNickname(savedNickname) // 원본 닉네임 저장
        }

        // 로컬 스토리지에서 설정 불러오기
        const savedNotifications = localStorage.getItem("notifications_enabled")
        const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null
        const savedLanguage = localStorage.getItem("language")

        if (savedNotifications !== null) {
          setNotificationsEnabled(savedNotifications === "true")
        }
        if (savedTheme) {
          setTheme(savedTheme)
        }
        if (savedLanguage) {
          setLanguage(savedLanguage)
        }
      } catch (error) {
        console.error("설정 로드 오류:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      
      // 현재 사용자 정보 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        alert("사용자 정보를 불러올 수 없습니다.")
        setSaving(false)
        return
      }

      // 닉네임 검증 (공백 제거)
      const trimmedNickname = nickname.trim()
      
      // 닉네임이 변경되었고 비어있지 않은 경우 중복 체크
      if (trimmedNickname && trimmedNickname !== originalNickname) {
        setCheckingNickname(true)
        setNicknameError("")
        
        const checkResponse = await fetch(
          `/api/user/nickname/check?nickname=${encodeURIComponent(trimmedNickname)}`
        )
        const checkResult = await checkResponse.json()
        
        setCheckingNickname(false)
        
        if (!checkResult.success || !checkResult.available) {
          setNicknameError(checkResult.message || "이미 사용 중인 닉네임입니다.")
          setSaving(false)
          return
        }
      }
      
      // 프로필 업데이트 또는 생성
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .upsert({
          user_id: user.id,
          nickname: trimmedNickname || null,
        }, {
          onConflict: "user_id"
        })
        .select()

      if (profileError) {
        console.error("프로필 저장 실패:", profileError)
        alert(`프로필 저장에 실패했습니다: ${profileError.message}`)
        setSaving(false)
        return
      }

      // 저장된 닉네임으로 상태 업데이트
      if (profileData && profileData.length > 0) {
        const savedNickname = profileData[0].nickname || ""
        setNickname(savedNickname)
        setOriginalNickname(savedNickname) // 원본 닉네임 업데이트
        setNicknameError("") // 에러 메시지 초기화
      }

      // 로컬 스토리지에 설정 저장
      localStorage.setItem("notifications_enabled", String(notificationsEnabled))
      localStorage.setItem("theme", theme)
      localStorage.setItem("language", language)

      alert("설정이 저장되었습니다.")
    } catch (error) {
      console.error("설정 저장 오류:", error)
      alert(`설정 저장에 실패했습니다: ${error instanceof Error ? error.message : "알 수 없는 오류"}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl border border-primary/20 bg-black/40 p-8">
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">설정</h1>
        <p className="text-gray-400">계정 및 앱 설정을 관리하세요</p>
      </div>

      {/* 프로필 설정 */}
      <Card className="border-primary/20 bg-black/40">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-white">프로필</CardTitle>
              <CardDescription>계정 정보를 관리하세요</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">이메일</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="bg-black/60 border-primary/20 text-gray-400"
            />
            <p className="text-xs text-gray-500">이메일은 변경할 수 없습니다</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nickname" className="text-gray-300">닉네임</Label>
            <div className="relative">
              <Input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value)
                  setNicknameError("") // 입력 시 에러 메시지 초기화
                }}
                placeholder="닉네임을 입력하세요"
                maxLength={20}
                className={`bg-black/60 border-primary/20 text-white ${
                  nicknameError ? "border-red-500" : ""
                }`}
              />
              {checkingNickname && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
            {nicknameError ? (
              <p className="text-xs text-red-400">{nicknameError}</p>
            ) : (
              <p className="text-xs text-gray-500">최대 20자까지 입력 가능합니다</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 알림 설정 */}
      <Card className="border-primary/20 bg-black/40">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-white">알림</CardTitle>
              <CardDescription>알림 설정을 관리하세요</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications" className="text-gray-300">알림 활성화</Label>
              <p className="text-xs text-gray-500 mt-1">거래 및 가격 변동 알림을 받습니다</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 테마 설정 */}
      <Card className="border-primary/20 bg-black/40">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              {theme === "dark" ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-white">테마</CardTitle>
              <CardDescription>화면 테마를 선택하세요</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setTheme("dark")}
              className={`p-4 rounded-lg border-2 transition-all ${
                theme === "dark"
                  ? "border-primary bg-primary/10"
                  : "border-primary/20 bg-black/60 hover:border-primary/40"
              }`}
            >
              <Moon className="w-6 h-6 mb-2 text-primary" />
              <p className="text-white font-medium">다크 모드</p>
              <p className="text-xs text-gray-500 mt-1">현재 테마</p>
            </button>
            <button
              onClick={() => setTheme("light")}
              className={`p-4 rounded-lg border-2 transition-all ${
                theme === "light"
                  ? "border-primary bg-primary/10"
                  : "border-primary/20 bg-black/60 hover:border-primary/40"
              }`}
            >
              <Sun className="w-6 h-6 mb-2 text-primary" />
              <p className="text-white font-medium">라이트 모드</p>
              <p className="text-xs text-gray-500 mt-1">준비 중</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 언어 설정 */}
      <Card className="border-primary/20 bg-black/40">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-white">언어</CardTitle>
              <CardDescription>표시 언어를 선택하세요</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language" className="text-gray-300">언어 선택</Label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-black/60 border border-primary/20 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {saving ? "저장 중..." : "설정 저장"}
        </Button>
      </div>
    </div>
  )
}


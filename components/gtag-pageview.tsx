"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { pageview } from "@/lib/utils/gtag"

/**
 * Google Analytics 페이지뷰 추적 컴포넌트
 * Next.js App Router에서 라우트 변경을 추적합니다.
 */
export function GtagPageview() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "")
      pageview(url)
    }
  }, [pathname, searchParams])

  return null
}


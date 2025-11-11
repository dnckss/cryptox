import { redirect } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { PortfolioSummary } from "@/components/portfolio-summary"
import { HoldingsList } from "@/components/holdings-list"
import { WelcomePopup } from "@/components/welcome-popup"
import { isAdmin } from "@/lib/utils/admin"

export default async function DashboardPage() {
  // 관리자 여부 확인
  const admin = await isAdmin()
  
  // 관리자면 충전 관리 페이지로 리다이렉트
  if (admin) {
    redirect("/dashboard/admin/charges")
  }

  return (
    <AppLayout>
      <section className="space-y-6 sm:space-y-8">
        {/* 헤더 */}
        <header className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
            대시보드
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            내 자산과 시장 동향을 한눈에 확인하세요
          </p>
        </header>

        {/* 내 자산 요약 */}
        <PortfolioSummary />

        {/* 보유 코인 */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">보유 코인</h2>
            <p className="text-xs sm:text-sm text-gray-500">
              실시간 가격과 손익을 확인하세요
            </p>
          </div>
          <HoldingsList />
        </section>
      </section>

      {/* 환영 팝업 */}
      <WelcomePopup />
    </AppLayout>
  )
}


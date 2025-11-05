import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
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
    <div className="min-h-screen bg-black flex">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">대시보드</h1>
            <p className="text-gray-400">내 자산과 시장 동향을 한눈에 확인하세요</p>
          </div>
          
          {/* 내 자산 요약 */}
          <PortfolioSummary />

          {/* 보유 코인 */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-6">보유 코인</h2>
            <HoldingsList />
          </div>
        </div>
      </main>
      
      {/* 환영 팝업 */}
      <WelcomePopup />
    </div>
  )
}


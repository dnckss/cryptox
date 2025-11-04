import { Sidebar } from "@/components/sidebar"
import { PortfolioSummary } from "@/components/portfolio-summary"
import { CoinList } from "@/components/coin-list"

export default function DashboardPage() {
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

          {/* 코인 랭킹 */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-6">인기 코인</h2>
            <CoinList />
          </div>
        </div>
      </main>
    </div>
  )
}


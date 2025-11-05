import { Sidebar } from "@/components/sidebar"
import { RankingPage } from "@/components/ranking-page"

export default function Ranking() {
  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <main className="flex-1 p-8">
        <RankingPage />
      </main>
    </div>
  )
}


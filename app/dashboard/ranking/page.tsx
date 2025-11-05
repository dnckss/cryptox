import { AppLayout } from "@/components/app-layout"
import { RankingPage } from "@/components/ranking-page"

export default function Ranking() {
  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <RankingPage />
    </div>
    </AppLayout>
  )
}


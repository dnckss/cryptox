import { Sidebar } from "@/components/sidebar"
import { ProfitPage } from "@/components/profit-page"

export default function ProfitHistoryPage() {
  return (
    <div className="min-h-screen bg-black flex">
      <Sidebar />
      <ProfitPage />
    </div>
  )
}


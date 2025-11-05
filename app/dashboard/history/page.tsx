import { Sidebar } from "@/components/sidebar"
import { HistoryPage } from "@/components/history-page"

export default function History() {
  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <HistoryPage />
    </div>
  )
}


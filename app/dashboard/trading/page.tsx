import { Sidebar } from "@/components/sidebar"
import { TradingPage } from "@/components/trading-page"

export default function TradingRoute() {
  return (
    <div className="min-h-screen bg-black flex">
      <Sidebar />
      <TradingPage />
    </div>
  )
}


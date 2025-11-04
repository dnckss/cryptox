import { Sidebar } from "@/components/sidebar"
import { CoinDetailPage } from "@/components/coin-detail-page"

export default async function CoinDetailRoute({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol } = await params

  return (
    <div className="min-h-screen bg-black flex">
      <Sidebar />
      <CoinDetailPage symbol={symbol} />
    </div>
  )
}


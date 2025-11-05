import { AppLayout } from "@/components/app-layout"
import { CoinDetailPage } from "@/components/coin-detail-page"

export default async function CoinDetailRoute({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol } = await params

  return (
    <AppLayout>
      <CoinDetailPage symbol={symbol} />
    </AppLayout>
  )
}


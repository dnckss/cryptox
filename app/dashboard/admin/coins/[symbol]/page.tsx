import { AppLayout } from "@/components/app-layout"
import { AdminCoinDetailPage } from "@/components/admin-coin-detail-page"

export default async function AdminCoinDetailRoute({
  params,
}: {
  params: Promise<{ symbol: string }>
}) {
  const { symbol } = await params

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <AdminCoinDetailPage symbol={symbol} />
      </div>
    </AppLayout>
  )
}

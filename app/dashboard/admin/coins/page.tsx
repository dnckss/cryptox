import { AppLayout } from "@/components/app-layout"
import { AdminCoinsPage } from "@/components/admin-coins-page"

export default function AdminCoins() {
  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <AdminCoinsPage />
      </div>
    </AppLayout>
  )
}

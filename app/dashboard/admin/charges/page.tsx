import { Sidebar } from "@/components/sidebar"
import { AdminChargesPage } from "@/components/admin-charges-page"

export default function AdminCharges() {
  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <main className="flex-1 p-8">
        <AdminChargesPage />
      </main>
    </div>
  )
}


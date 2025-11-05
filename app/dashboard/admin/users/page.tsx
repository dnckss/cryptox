import { Sidebar } from "@/components/sidebar"
import { AdminUsersPage } from "@/components/admin-users-page"

export default function AdminUsers() {
  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <main className="flex-1 p-8">
        <AdminUsersPage />
      </main>
    </div>
  )
}


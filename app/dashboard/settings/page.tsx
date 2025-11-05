import { Sidebar } from "@/components/sidebar"
import { SettingsPage } from "@/components/settings-page"

export default function Settings() {
  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <main className="flex-1 p-8">
        <SettingsPage />
      </main>
    </div>
  )
}


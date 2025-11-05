import { AppLayout } from "@/components/app-layout"
import { SettingsPage } from "@/components/settings-page"

export default function Settings() {
  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <SettingsPage />
      </div>
    </AppLayout>
  )
}


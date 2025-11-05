import { Sidebar } from "@/components/sidebar"
import { WalletPage } from "@/components/wallet-page"

export default function Wallet() {
  return (
    <div className="flex min-h-screen bg-black">
      <Sidebar />
      <WalletPage />
    </div>
  )
}


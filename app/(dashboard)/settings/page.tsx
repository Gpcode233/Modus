import { getNetworkName } from "@/lib/payments"
import { getSpendAuthority, getShippingAddress, getUserWallet } from "@/lib/store"
import { getUserIdFromCookies } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { SettingsForm } from "./settings-form"

export default async function SettingsPage() {
  const userId = await getUserIdFromCookies()
  if (!userId) redirect("/login")

  const network = getNetworkName()
  const [spendAuthority, shippingAddress, wallet] = await Promise.all([
    getSpendAuthority(userId),
    getShippingAddress(userId),
    getUserWallet(userId),
  ])
  const address = wallet?.address ?? ""

  return (
    <div className="h-full overflow-y-auto flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure agent behavior, API connections, and notification preferences
        </p>
      </div>

      <SettingsForm
        walletAddress={address}
        network={network}
        spendAuthority={spendAuthority}
        shippingAddress={shippingAddress}
      />
    </div>
  )
}

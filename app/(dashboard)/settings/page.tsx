import { getAgentAddress, getNetworkName, isPaymentConfigured } from "@/lib/payments"
import { getSpendAuthority } from "@/lib/store"
import { SettingsForm } from "./settings-form"

export default async function SettingsPage() {
  const address = isPaymentConfigured() ? (getAgentAddress() ?? "") : ""
  const network = getNetworkName()
  const spendAuthority = getSpendAuthority()

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
      />
    </div>
  )
}

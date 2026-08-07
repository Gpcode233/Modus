import { HugeiconsIcon } from "@hugeicons/react"
import {
  Wallet01Icon,
  ArrowRight01Icon,
  ArrowDown01Icon,
  CheckmarkCircle01Icon,
  ShieldKeyIcon,
} from "@hugeicons/core-free-icons"
import { getWallet, getTransactions, getThirtyDayFlow } from "@/lib/store"
import type { AccountsData, Transaction } from "@/lib/types"

async function getAccountsData(): Promise<AccountsData> {
  const wallet = getWallet()
  const transactions = getTransactions()
  const { inbound, outbound } = getThirtyDayFlow()
  return { wallet, inboundThirtyDay: inbound, outboundThirtyDay: outbound, transactions }
}

function formatUsdc(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isIn = tx.type === "inbound"
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            isIn ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
          }`}
        >
          <HugeiconsIcon
            icon={isIn ? ArrowDown01Icon : ArrowRight01Icon}
            size={16}
            color="currentColor"
            strokeWidth={1.5}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{tx.description}</p>
          <p className="font-mono text-xs text-gray-400">
            {tx.txHash}
            {tx.blockNumber ? ` · block #${tx.blockNumber.toLocaleString()}` : ""} · {formatDate(tx.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-sm font-semibold tabular-nums ${isIn ? "text-green-600" : "text-red-500"}`}>
          {isIn ? "+" : "−"}{formatUsdc(tx.amountUsdc)} USDC
        </span>
        <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} color="currentColor" strokeWidth={1.5} className="text-green-600" />
          <span className="text-xs font-medium text-green-700 capitalize">{tx.status}</span>
        </div>
      </div>
    </div>
  )
}

export default async function AccountsPage() {
  const data = await getAccountsData()
  const { wallet, inboundThirtyDay, outboundThirtyDay, transactions } = data

  return (
    <div className="h-full overflow-y-auto flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Accounts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Treasury wallet powered by Circle App Kit on {wallet.network}
        </p>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <HugeiconsIcon icon={Wallet01Icon} size={16} color="currentColor" strokeWidth={1.5} />
            <span className="text-xs font-medium uppercase tracking-wide">USDC Balance</span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">
            {formatUsdc(wallet.balanceUsdc)}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">USDC · {wallet.network}</p>
          <p className="mt-3 font-mono text-xs text-gray-400">{wallet.address}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <HugeiconsIcon icon={ArrowDown01Icon} size={16} color="currentColor" strokeWidth={1.5} />
            <span className="text-xs font-medium uppercase tracking-wide">Inbound (30d)</span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-green-600 tabular-nums">
            +{formatUsdc(inboundThirtyDay)}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">USDC received</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="currentColor" strokeWidth={1.5} />
            <span className="text-xs font-medium uppercase tracking-wide">Outbound (30d)</span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-red-500 tabular-nums">
            −{formatUsdc(outboundThirtyDay)}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">USDC spent</p>
        </div>
      </div>

      {/* Spend authority */}
      <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 px-5 py-3">
        <HugeiconsIcon
          icon={ShieldKeyIcon}
          size={18}
          color="currentColor"
          strokeWidth={1.5}
          className="text-green-600 shrink-0"
        />
        <p className="text-sm text-green-800">
          <span className="font-semibold">Autonomous spend authority:</span>{" "}
          {formatUsdc(wallet.spendAuthorityUsdc)} USDC per transaction · enforced by treasury policy
        </p>
      </div>

      {/* Transactions */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Transaction History</h2>
        </div>
        {transactions.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-400">No transactions yet.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

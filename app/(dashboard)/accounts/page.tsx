import { redirect } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Wallet01Icon,
  ArrowDownLeft01Icon,
  ArrowUpRight03Icon,
  ArchiveArrowDownIcon,
  Invoice03Icon,
  ArchiveArrowUpIcon,
  CheckmarkCircle01Icon,
  Alert01Icon,
} from "@hugeicons/core-free-icons"
import { getTransactions, getThirtyDayFlow, getThirtyDayTrend, getSpendAuthority, getUserWallet } from "@/lib/store"
import { getUserIdFromCookies } from "@/lib/auth-server"
import {
  getUsdcBalance,
  getNetworkName,
} from "@/lib/payments"
import { getAgentIdentity } from "@/lib/identity"
import type { Transaction } from "@/lib/types"
import { SpendAuthorityEditor } from "@/components/spend-authority-editor"
import { NetworkTabs } from "@/components/network-tabs"
import { FundWalletDialog } from "@/components/fund-wallet-dialog"
import { AccountsFlowChart } from "@/components/accounts-flow-chart"
import { IdentityCard } from "@/components/identity-card"
import { RefreshBalanceButton } from "@/components/refresh-balance-button"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"

async function getPageData() {
  const userId = await getUserIdFromCookies()
  if (!userId) return null

  const [transactions, { inbound, outbound }, { inbound: inboundTrend, outbound: outboundTrend, dates: trendDates }, spendAuthorityUsdc, wallet] = await Promise.all([
    getTransactions(userId),
    getThirtyDayFlow(userId),
    getThirtyDayTrend(userId),
    getSpendAuthority(userId),
    getUserWallet(userId),
  ])

  const address = wallet?.address ?? null
  let balanceUsdc = 0
  if (address) {
    balanceUsdc = await getUsdcBalance(address)
  }

  const identity = address ? await getAgentIdentity() : null

  return {
    address,
    balanceUsdc,
    network: getNetworkName(),
    spendAuthorityUsdc,
    inboundThirtyDay: inbound,
    outboundThirtyDay: outbound,
    inboundTrend,
    outboundTrend,
    trendDates,
    transactions,
    live: !!address,
    identity,
  }
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
            icon={isIn ? ArrowDownLeft01Icon : ArrowUpRight03Icon}
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
  const data = await getPageData()
  if (!data) { redirect("/login") }
  const { address, balanceUsdc, network, spendAuthorityUsdc, inboundThirtyDay, outboundThirtyDay, inboundTrend, outboundTrend, trendDates, transactions, live, identity } = data

  return (
    <div className="h-full overflow-y-auto flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">Agent treasury · {network}</p>
        </div>
        <div className="flex items-center gap-3">
          <NetworkTabs />
          {live && (
            <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              Live on-chain
            </span>
          )}
        </div>
      </div>

      {!live && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <HugeiconsIcon icon={Alert01Icon} size={18} color="currentColor" strokeWidth={1.5} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">Wallet not ready</p>
              <p className="mt-1 text-xs text-amber-700">
                Your wallet is being generated. Try refreshing the page.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Balance cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* USDC Balance */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500">
              <HugeiconsIcon icon={Wallet01Icon} size={16} color="currentColor" strokeWidth={1.5} />
              <span className="text-xs font-medium uppercase tracking-wide">USDC Balance</span>
            </div>
            {live && address && <FundWalletDialog agentAddress={address} />}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <p className="text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">
              {live ? `$${formatUsdc(balanceUsdc)}` : "—"}
            </p>
            {live && <RefreshBalanceButton />}
          </div>
          <p className="mt-0.5 text-xs text-gray-400">USDC · {network}</p>
          {address && (
            <p className="mt-3 font-mono text-xs text-gray-400 truncate">{address}</p>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <HugeiconsIcon icon={ArchiveArrowDownIcon} size={18} />
            <span className="text-xs font-medium uppercase tracking-wide">Inbound (30d)</span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-green-600 tabular-nums">
            {live ? `+$${formatUsdc(inboundThirtyDay)}` : "—"}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">USDC received</p>
          <AccountsFlowChart series={inboundTrend} dates={trendDates} color="green" />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <HugeiconsIcon icon={ArchiveArrowUpIcon} size={18} />
            <span className="text-xs font-medium uppercase tracking-wide">Outbound (30d)</span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-red-500 tabular-nums">
            {live ? `−$${formatUsdc(outboundThirtyDay)}` : "—"}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">USDC spent</p>
          <AccountsFlowChart series={outboundTrend} dates={trendDates} color="red" />
        </div>
      </div>

      {/* Explorer link */}
      {live && address && (
        <a
          href={`https://testnet.arcscan.app/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-green-700 hover:text-green-900 transition-colors"
        >
          View on Arc Testnet Explorer →
        </a>
      )}

      {/* Spend authority — owner-set */}
      <SpendAuthorityEditor current={spendAuthorityUsdc} />

      {/* Agent identity — ERC-8004 */}
      <IdentityCard
        initialIdentity={identity ? {
          registered: identity.registered,
          tokenId: identity.tokenId,
          address: identity.address,
          explorerUrl: identity.explorerUrl,
        } : null}
        configured={live}
      />

      {/* Transactions */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-gray-900">Transaction History</h2>
        </div>
        {transactions.length === 0 ? (
          <Empty className="py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Invoice03Icon} size={39} color="currentColor" strokeWidth={1.5} />
              </EmptyMedia>
              <EmptyTitle>No transactions yet</EmptyTitle>
              <EmptyDescription>
                Payments settled by the agent will appear here in real time.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
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

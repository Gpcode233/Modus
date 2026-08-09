import { NextResponse } from "next/server"
import { getTransactions, getThirtyDayFlow, getSpendAuthority } from "@/lib/store"
import {
  getAgentAddress,
  getNetworkName,
  getUsdcBalance,
  fetchCircleWalletBalance,
  isArcConfigured,
  isCircleConfigured,
  isPaymentConfigured,
} from "@/lib/payments"
import { getUserIdFromRequest } from "@/lib/auth-server"

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [transactions, { inbound, outbound }, spendAuthorityUsdc] = await Promise.all([
    getTransactions(userId),
    getThirtyDayFlow(userId),
    getSpendAuthority(userId),
  ])

  let address: string | null = null
  let balanceUsdc = 0
  let network = "Arc Testnet (not configured)"
  let live = false

  if (isPaymentConfigured()) {
    address = getAgentAddress()
    network = getNetworkName()
    live = true
    if (address) {
      if (isArcConfigured()) {
        balanceUsdc = await getUsdcBalance(address)
      } else if (isCircleConfigured()) {
        balanceUsdc = await fetchCircleWalletBalance(process.env.CIRCLE_WALLET_ID!)
      }
    }
  }

  return NextResponse.json({
    wallet: {
      address: address ?? "0x0000000000000000000000000000000000000000",
      balanceUsdc,
      spendAuthorityUsdc,
      network,
    },
    inboundThirtyDay: inbound,
    outboundThirtyDay: outbound,
    transactions,
    live,
  })
}

import { NextResponse } from "next/server"
import { getTransactions, getThirtyDayFlow, getSpendAuthority, getUserWallet } from "@/lib/store"
import { getNetworkName, getUsdcBalance } from "@/lib/payments"
import { getUserIdFromRequest } from "@/lib/auth-server"

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [transactions, { inbound, outbound }, spendAuthorityUsdc, wallet] = await Promise.all([
    getTransactions(userId),
    getThirtyDayFlow(userId),
    getSpendAuthority(userId),
    getUserWallet(userId),
  ])

  const address = wallet?.address ?? null
  let balanceUsdc = 0
  if (address) {
    balanceUsdc = await getUsdcBalance(address)
  }

  return NextResponse.json({
    wallet: {
      address: address ?? "0x0000000000000000000000000000000000000000",
      balanceUsdc,
      spendAuthorityUsdc,
      network: getNetworkName(),
    },
    inboundThirtyDay: inbound,
    outboundThirtyDay: outbound,
    transactions,
    live: !!address,
  })
}

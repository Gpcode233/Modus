import { NextResponse } from "next/server"
import {
  getAgentAddress,
  getNetworkName,
  getUsdcBalance,
  fetchCircleWalletBalance,
  isArcConfigured,
  isCircleConfigured,
  isPaymentConfigured,
} from "@/lib/payments"
import { getSpendAuthority } from "@/lib/store"
import { getUserIdFromRequest } from "@/lib/auth-server"

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (!isPaymentConfigured()) {
    return NextResponse.json({
      address: null,
      balanceUsdc: 0,
      spendAuthorityUsdc: await getSpendAuthority(userId),
      network: "Arc Testnet (not configured)",
      configured: false,
      live: false,
    })
  }

  const address = getAgentAddress()
  if (!address) {
    return NextResponse.json({ error: "Could not resolve wallet address" }, { status: 500 })
  }

  let balanceUsdc = 0
  if (isArcConfigured()) {
    balanceUsdc = await getUsdcBalance(address)
  } else if (isCircleConfigured()) {
    balanceUsdc = await fetchCircleWalletBalance(process.env.CIRCLE_WALLET_ID!)
  }

  return NextResponse.json({
    address,
    balanceUsdc,
    spendAuthorityUsdc: await getSpendAuthority(userId),
    network: getNetworkName(),
    configured: true,
    live: true,
  })
}

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
import { getWallet } from "@/lib/store"

export async function GET() {
  // Fallback to mock when nothing configured
  if (!isPaymentConfigured()) {
    const mock = getWallet()
    return NextResponse.json({ ...mock, configured: false, live: false })
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

  const mock = getWallet()

  return NextResponse.json({
    address,
    balanceUsdc,
    spendAuthorityUsdc: mock.spendAuthorityUsdc,
    network: getNetworkName(),
    configured: true,
    live: true,
  })
}

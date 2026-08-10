import { NextResponse } from "next/server"
import { getSpendAuthority, getUserWallet } from "@/lib/store"
import { getNetworkName, getUsdcBalance } from "@/lib/payments"
import { getUserIdFromRequest } from "@/lib/auth-server"

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [wallet, spendAuthorityUsdc] = await Promise.all([
    getUserWallet(userId),
    getSpendAuthority(userId),
  ])

  if (!wallet) {
    return NextResponse.json({
      address: null,
      balanceUsdc: 0,
      spendAuthorityUsdc,
      network: getNetworkName(),
      configured: false,
      live: false,
    })
  }

  const balanceUsdc = await getUsdcBalance(wallet.address)

  return NextResponse.json({
    address: wallet.address,
    balanceUsdc,
    spendAuthorityUsdc,
    network: getNetworkName(),
    configured: true,
    live: true,
  })
}

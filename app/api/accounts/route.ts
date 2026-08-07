import { NextResponse } from "next/server"
import { getWallet, getTransactions, getThirtyDayFlow } from "@/lib/store"
import type { AccountsData } from "@/lib/types"

export async function GET() {
  const wallet = getWallet()
  const transactions = getTransactions()
  const { inbound, outbound } = getThirtyDayFlow()

  const data: AccountsData = {
    wallet,
    inboundThirtyDay: inbound,
    outboundThirtyDay: outbound,
    transactions,
  }

  return NextResponse.json(data)
}

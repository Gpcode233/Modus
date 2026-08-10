import { NextResponse } from "next/server"
import { getAgentIdentity } from "@/lib/identity"
import { getUserWallet } from "@/lib/store"
import { getUserIdFromRequest } from "@/lib/auth-server"

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const wallet = await getUserWallet(userId)
  if (!wallet) return NextResponse.json({ configured: false })

  const identity = await getAgentIdentity(wallet.privateKey, wallet.address)
  if (!identity) return NextResponse.json({ configured: false })

  return NextResponse.json({ configured: true, ...identity })
}

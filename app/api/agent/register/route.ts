import { NextResponse } from "next/server"
import { registerAgentIdentity } from "@/lib/identity"
import { getUserWallet } from "@/lib/store"
import { getUserIdFromRequest } from "@/lib/auth-server"

export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const wallet = await getUserWallet(userId)
  if (!wallet) return NextResponse.json({ error: "Wallet not found for user" }, { status: 400 })

  try {
    const result = await registerAgentIdentity(wallet.privateKey, wallet.address)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Registration failed" },
      { status: 500 }
    )
  }
}

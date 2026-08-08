import { NextResponse } from "next/server"
import { getAgentIdentity } from "@/lib/identity"

export async function GET() {
  const identity = await getAgentIdentity()
  if (!identity) {
    return NextResponse.json({ configured: false })
  }
  return NextResponse.json({ configured: true, ...identity })
}

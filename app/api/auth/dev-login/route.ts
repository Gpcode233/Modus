import { NextResponse } from "next/server"
import { getAgentAddress } from "@/lib/payments"

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  const address = getAgentAddress()
  if (!address) {
    return NextResponse.json(
      { error: "ARC_PRIVATE_KEY not set — cannot derive dev wallet identity" },
      { status: 400 }
    )
  }

  return NextResponse.json({ address })
}

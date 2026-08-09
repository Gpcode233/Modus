import { NextResponse } from "next/server"
import { getAgentAddress } from "@/lib/payments"
import { cookies } from "next/headers"

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

  const cookieStore = await cookies()
  cookieStore.set("modus-dev-user", `dev:${address}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })

  return NextResponse.json({ address })
}

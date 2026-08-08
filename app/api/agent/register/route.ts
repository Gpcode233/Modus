import { NextResponse } from "next/server"
import { registerAgentIdentity } from "@/lib/identity"

export async function POST() {
  if (!process.env.ARC_PRIVATE_KEY) {
    return NextResponse.json({ error: "ARC_PRIVATE_KEY not configured" }, { status: 400 })
  }
  try {
    const result = await registerAgentIdentity()
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Registration failed" },
      { status: 500 }
    )
  }
}

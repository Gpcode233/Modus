import { getUserIdFromRequest } from "@/lib/auth-server"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  return NextResponse.json({ userId })
}

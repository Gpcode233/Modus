import { NextResponse } from "next/server"
import { getOrders } from "@/lib/store"
import { getUserIdFromRequest } from "@/lib/auth-server"

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(await getOrders(userId))
}

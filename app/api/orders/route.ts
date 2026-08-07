import { NextResponse } from "next/server"
import { getOrders } from "@/lib/store"

export async function GET() {
  return NextResponse.json(getOrders())
}

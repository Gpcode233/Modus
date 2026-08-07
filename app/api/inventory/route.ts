import { NextRequest, NextResponse } from "next/server"
import { getInventory, createInventoryItem } from "@/lib/store"
import type { InventoryItem } from "@/lib/types"

export async function GET() {
  return NextResponse.json(getInventory())
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const required = ["sku", "name", "category", "location", "qtyOnHand", "reorderPoint", "unitCostUsdc"]
  for (const field of required) {
    if (body[field] === undefined || body[field] === "") {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 })
    }
  }

  const data: Omit<InventoryItem, "id" | "createdAt" | "updatedAt"> = {
    sku: String(body.sku).trim().toUpperCase(),
    name: String(body.name).trim(),
    category: String(body.category).trim(),
    location: String(body.location).trim(),
    qtyOnHand: Number(body.qtyOnHand),
    reorderPoint: Number(body.reorderPoint),
    unitCostUsdc: Number(body.unitCostUsdc),
    imageUrl: body.imageUrl || undefined,
    supplierId: body.supplierId || undefined,
  }

  if (isNaN(data.qtyOnHand) || data.qtyOnHand < 0) {
    return NextResponse.json({ error: "qtyOnHand must be a non-negative number" }, { status: 400 })
  }
  if (isNaN(data.reorderPoint) || data.reorderPoint < 1) {
    return NextResponse.json({ error: "reorderPoint must be at least 1" }, { status: 400 })
  }
  if (isNaN(data.unitCostUsdc) || data.unitCostUsdc < 0) {
    return NextResponse.json({ error: "unitCostUsdc must be a non-negative number" }, { status: 400 })
  }

  const item = createInventoryItem(data)
  return NextResponse.json(item, { status: 201 })
}

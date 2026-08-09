import { NextRequest, NextResponse } from "next/server"
import { getInventory, createInventoryItem } from "@/lib/store"
import { getUserIdFromRequest } from "@/lib/auth-server"

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(await getInventory(userId))
}

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  const required = ["sku", "name", "category", "location", "qtyOnHand", "reorderPoint", "unitCostUsdc"]
  for (const field of required) {
    if (body[field] === undefined || body[field] === "") {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 })
    }
  }

  const qtyOnHand = Number(body.qtyOnHand)
  const reorderPoint = Number(body.reorderPoint)
  const unitCostUsdc = Number(body.unitCostUsdc)

  if (isNaN(qtyOnHand) || qtyOnHand < 0) {
    return NextResponse.json({ error: "qtyOnHand must be a non-negative number" }, { status: 400 })
  }
  if (isNaN(reorderPoint) || reorderPoint < 1) {
    return NextResponse.json({ error: "reorderPoint must be at least 1" }, { status: 400 })
  }
  if (isNaN(unitCostUsdc) || unitCostUsdc < 0) {
    return NextResponse.json({ error: "unitCostUsdc must be a non-negative number" }, { status: 400 })
  }

  const item = await createInventoryItem(userId, {
    sku: String(body.sku).trim().toUpperCase(),
    name: String(body.name).trim(),
    category: String(body.category).trim(),
    location: String(body.location).trim(),
    qtyOnHand,
    reorderPoint,
    unitCostUsdc,
  })
  return NextResponse.json(item, { status: 201 })
}

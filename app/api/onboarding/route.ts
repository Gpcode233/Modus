import { NextResponse } from "next/server"
import { z } from "zod"
import { isOnboardingComplete, getStoreName, completeOnboarding, createInventoryItem } from "@/lib/store"

const body = z.object({
  storeName: z.string().min(1).max(100),
  spendAuthorityUsdc: z.number().positive(),
  inventory: z
    .array(
      z.object({
        name: z.string().min(1),
        sku: z.string().min(1),
        category: z.string().min(1),
        location: z.string().min(1),
        qtyOnHand: z.number().int().min(0),
        reorderPoint: z.number().int().positive(),
        unitCostUsdc: z.number().positive(),
      })
    )
    .optional()
    .default([]),
})

export async function GET() {
  return NextResponse.json({
    complete: isOnboardingComplete(),
    storeName: getStoreName(),
  })
}

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { storeName, spendAuthorityUsdc, inventory } = parsed.data
  completeOnboarding(storeName, spendAuthorityUsdc)
  for (const item of inventory) {
    createInventoryItem(item)
  }
  return NextResponse.json({ ok: true })
}

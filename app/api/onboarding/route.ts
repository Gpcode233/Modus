import { NextResponse } from "next/server"
import { z } from "zod"
import { isOnboardingComplete, getStoreName, completeOnboarding } from "@/lib/store"
import { getUserIdFromRequest } from "@/lib/auth-server"

const bodySchema = z.object({
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

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({
    complete: await isOnboardingComplete(userId),
    storeName: await getStoreName(userId),
  })
}

export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { storeName, spendAuthorityUsdc, inventory } = parsed.data
  await completeOnboarding(userId, storeName, spendAuthorityUsdc, inventory)
  return NextResponse.json({ ok: true })
}

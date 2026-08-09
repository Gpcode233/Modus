import { NextResponse } from "next/server"
import { z } from "zod"
import { getSpendAuthority, setSpendAuthority } from "@/lib/store"
import { getUserIdFromRequest } from "@/lib/auth-server"

const bodySchema = z.object({
  amount: z.number().positive("Must be a positive number"),
})

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ spendAuthorityUsdc: await getSpendAuthority(userId) })
}

export async function PUT(req: Request) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  await setSpendAuthority(userId, parsed.data.amount)
  return NextResponse.json({ spendAuthorityUsdc: parsed.data.amount })
}

import { NextResponse } from "next/server"
import { z } from "zod"
import { getSpendAuthority, setSpendAuthority } from "@/lib/store"

const body = z.object({
  amount: z.number().positive("Must be a positive number"),
})

export async function GET() {
  return NextResponse.json({ spendAuthorityUsdc: getSpendAuthority() })
}

export async function PUT(req: Request) {
  const parsed = body.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  setSpendAuthority(parsed.data.amount)
  return NextResponse.json({ spendAuthorityUsdc: parsed.data.amount })
}

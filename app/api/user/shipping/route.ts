import { getUserIdFromRequest } from "@/lib/auth-server"
import { setShippingAddress } from "@/lib/store"
import { z } from "zod"

const schema = z.object({ address: z.string().min(1) })

export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid address" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  await setShippingAddress(userId, parsed.data.address)
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

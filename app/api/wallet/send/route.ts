import { NextResponse } from "next/server"
import { z } from "zod"
import { sendUsdc, isPaymentConfigured } from "@/lib/payments"
import { recordTransaction, advanceOrderStatus } from "@/lib/store"

const body = z.object({
  to: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address"),
  amount: z.string().regex(/^\d+(\.\d+)?$/, "Invalid amount"),
  description: z.string().min(1),
  orderId: z.string().optional(),
})

export async function POST(req: Request) {
  if (!isPaymentConfigured()) {
    return NextResponse.json(
      { error: "Payment not configured. Set ARC_PRIVATE_KEY or CIRCLE_* env vars." },
      { status: 503 }
    )
  }

  const parsed = body.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { to, amount, description, orderId } = parsed.data

  try {
    const result = await sendUsdc(to, amount)

    const tx = recordTransaction({
      type: "outbound",
      amountUsdc: parseFloat(amount),
      description,
      txHash: result.txHash,
      status: "settled",
      orderId,
    })

    if (orderId) {
      advanceOrderStatus(
        orderId,
        "processing",
        "Payment Settled",
        `${amount} USDC settled — ${result.txHash.slice(0, 10)}…`
      )
    }

    return NextResponse.json({ ...result, transactionId: tx.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { createAnthropic } from "@ai-sdk/anthropic"
import { streamText, tool, zodSchema, isStepCount } from "ai"
import { z } from "zod"
import {
  getInventory,
  getOrders,
  getSpendAuthority,
  createOrder,
  advanceOrderStatus,
  recordTransaction,
} from "@/lib/store"
import {
  sendUsdc,
  isPaymentConfigured,
  getAgentAddress,
  getUsdcBalance,
  isArcConfigured,
} from "@/lib/payments"
import { getUserIdFromRequest } from "@/lib/auth-server"
import { checkChatRateLimit } from "@/lib/rate-limit"

export const maxDuration = 30

const provider = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
  baseURL: process.env.ANTHROPIC_BASE_URL,
})

const MODEL = process.env.AI_MODEL ?? "claude-sonnet-4-6"

const SYSTEM_PROMPT = `You are the Modus autonomous procurement agent — an AI that manages inventory and supplier purchasing for businesses using USDC on Arc L1 (Circle's blockchain).

Your responsibilities:
- Monitor inventory levels and flag items below reorder threshold
- Query and evaluate supplier quotes when inventory is low
- Place purchase orders and settle payments in USDC via Circle App Kit
- Track all orders and provide status updates
- Give concise, data-driven answers about the treasury, inventory, and orders

You have access to real-time data tools. Always check the live data before answering questions about inventory or orders. Be precise — include SKUs, quantities, costs, and USDC amounts in your answers. Keep responses concise but complete.`

export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const rate = await checkChatRateLimit(userId)
  if (!rate.allowed) {
    return new Response(
      JSON.stringify({ error: `Rate limit exceeded. Try again next hour. (${rate.limit} requests/hour)` }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": String(rate.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }

  const { messages } = await req.json()
  const spendAuthority = await getSpendAuthority(userId)

  try {
    const result = streamText({
      model: provider(MODEL),
      instructions:
        SYSTEM_PROMPT +
        (spendAuthority != null
          ? `\n\nAutonomous spend authority: ${spendAuthority} USDC per transaction.`
          : "\n\nNote: Autonomous spend authority has not been set by the store owner yet."),
      messages,
      tools: {
        getInventoryStatus: tool({
          description: "Get current inventory levels, reorder points, and stock status for all items",
          inputSchema: zodSchema(z.object({})),
          execute: async () => {
            const items = await getInventory(userId)
            return items.map((item) => ({
              id: item.id,
              sku: item.sku,
              name: item.name,
              location: item.location,
              qtyOnHand: item.qtyOnHand,
              reorderPoint: item.reorderPoint,
              unitCostUsdc: item.unitCostUsdc,
              status:
                item.qtyOnHand === 0
                  ? "out_of_stock"
                  : item.qtyOnHand / item.reorderPoint < 0.4
                  ? "critical"
                  : item.qtyOnHand < item.reorderPoint
                  ? "low"
                  : "ok",
            }))
          },
        }),

        getOrderStatus: tool({
          description: "Get the status and timeline of all purchase orders",
          inputSchema: zodSchema(
            z.object({
              poNumber: z.string().optional().describe("Filter by PO number (optional)"),
            })
          ),
          execute: async ({ poNumber }) => {
            const orders = await getOrders(userId)
            const filtered = poNumber
              ? orders.filter((o) => o.poNumber === poNumber)
              : orders
            return filtered.map((o) => ({
              poNumber: o.poNumber,
              itemName: o.itemName,
              sku: o.sku,
              supplier: o.supplier,
              qty: o.qty,
              totalUsdc: o.totalUsdc,
              status: o.status,
              txHash: o.txHash,
              latestEvent: o.timeline[o.timeline.length - 1],
              createdAt: o.createdAt,
            }))
          },
        }),

        getWalletBalance: tool({
          description: "Get the current live USDC treasury balance and spend authority",
          inputSchema: zodSchema(z.object({})),
          execute: async () => {
            const address = getAgentAddress()
            if (!address) {
              return { configured: false, message: "ARC_PRIVATE_KEY not set" }
            }
            let balanceUsdc = 0
            if (isArcConfigured()) {
              balanceUsdc = await getUsdcBalance(address)
            }
            return {
              address,
              balanceUsdc,
              spendAuthorityUsdc: await getSpendAuthority(userId),
              network: "Arc Testnet",
              configured: true,
            }
          },
        }),

        initiateProcurement: tool({
          description:
            "Initiate an autonomous purchase order for an inventory item. Use this when the user confirms they want to proceed with a purchase.",
          inputSchema: zodSchema(
            z.object({
              inventoryItemId: z.string().describe("The ID of the inventory item to reorder"),
              supplier: z.string().describe("Chosen supplier name"),
              qty: z.number().int().positive().describe("Quantity to order"),
              unitCostUsdc: z.number().positive().describe("Agreed price per unit in USDC"),
              supplierAddress: z
                .string()
                .regex(/^0x[a-fA-F0-9]{40}$/)
                .optional()
                .describe("Supplier EVM wallet address for USDC payment (0x...). Omit if unknown."),
            })
          ),
          execute: async ({ inventoryItemId, supplier, qty, unitCostUsdc, supplierAddress }) => {
            const items = await getInventory(userId)
            const item = items.find((i) => i.id === inventoryItemId)
            if (!item) return { error: `Inventory item ${inventoryItemId} not found` }

            const totalUsdc = qty * unitCostUsdc
            const spendAuth = await getSpendAuthority(userId)

            if (spendAuth == null) {
              return { error: "Spend authority not set. Store owner must configure it in the Accounts page." }
            }
            if (totalUsdc > spendAuth) {
              return { error: `Order total (${totalUsdc} USDC) exceeds spend authority (${spendAuth} USDC). Store owner must increase the limit.` }
            }

            if (isArcConfigured()) {
              const address = getAgentAddress()
              if (address) {
                const liveBalance = await getUsdcBalance(address)
                if (totalUsdc > liveBalance) {
                  return { error: `Insufficient balance: need ${totalUsdc} USDC, wallet has ${liveBalance} USDC` }
                }
              }
            }

            const order = await createOrder(userId, {
              inventoryItemId: item.id,
              sku: item.sku,
              itemName: item.name,
              supplier,
              qty,
              unitCostUsdc,
              totalUsdc,
              status: "pending",
            })

            if (isPaymentConfigured() && supplierAddress) {
              try {
                const result = await sendUsdc(supplierAddress, totalUsdc.toFixed(2))
                await recordTransaction(userId, {
                  type: "outbound",
                  amountUsdc: totalUsdc,
                  description: `${supplier} — ${order.poNumber}`,
                  txHash: result.txHash,
                  status: "settled",
                  orderId: order.id,
                })
                await advanceOrderStatus(
                  userId,
                  order.id,
                  "processing",
                  "Payment Settled",
                  `${totalUsdc} USDC settled on Arc L1 — tx ${result.txHash.slice(0, 10)}…`
                )
                return {
                  poNumber: order.poNumber,
                  status: "processing",
                  totalUsdc,
                  supplier,
                  txHash: result.txHash,
                  explorerUrl: result.explorerUrl,
                  message: `${totalUsdc} USDC settled on-chain`,
                  live: true,
                }
              } catch (err) {
                const msg = err instanceof Error ? err.message : "Payment failed"
                return { error: `Order created (${order.poNumber}) but payment failed: ${msg}` }
              }
            }

            const mockTxHash = `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`
            const mockBlock = Math.floor(4800000 + Math.random() * 100000)
            await recordTransaction(userId, {
              type: "outbound",
              amountUsdc: totalUsdc,
              description: `${supplier} — ${order.poNumber}`,
              txHash: mockTxHash,
              status: "settled",
              orderId: order.id,
            })
            await advanceOrderStatus(
              userId,
              order.id,
              "processing",
              "Payment Settled",
              `${totalUsdc} USDC settled on Arc L1 — block #${mockBlock.toLocaleString()}`
            )

            return {
              poNumber: order.poNumber,
              status: "processing",
              totalUsdc,
              supplier,
              txHash: mockTxHash,
              blockNumber: mockBlock,
              message: `${totalUsdc} USDC settled (simulated — configure ARC_PRIVATE_KEY for live payments)`,
              live: false,
            }
          },
        }),
      },
      stopWhen: isStepCount(5),
    })

    return result.toUIMessageStreamResponse()
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

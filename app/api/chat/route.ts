import { createGroq } from "@ai-sdk/groq"
import { streamText, tool, zodSchema, isStepCount, convertToModelMessages } from "ai"
import { z } from "zod"
import {
  getInventory,
  getOrders,
  getSpendAuthority,
  createOrder,
  advanceOrderStatus,
  recordTransaction,
  getAgentMemories,
  saveAgentMemory,
  getShippingAddress,
  createInventoryItem,
  getUserWallet,
} from "@/lib/store"
import {
  getUsdcBalance,
  sendUsdcFromPrivateKey,
} from "@/lib/payments"
import { getUserIdFromRequest } from "@/lib/auth-server"
import { checkChatRateLimit } from "@/lib/rate-limit"

export const maxDuration = 30

const provider = createGroq({
  apiKey: process.env.GROQ_API_KEY ?? "",
})

const MODEL = process.env.AI_MODEL ?? "llama-3.3-70b-versatile"

const BASE_SYSTEM_PROMPT = `You are the Modus autonomous procurement agent — an AI that manages inventory and supplier purchasing for businesses using USDC on Arc L1 (Circle's blockchain).

Your responsibilities:
- Monitor inventory levels and flag items below reorder threshold
- Query and evaluate supplier quotes when inventory is low
- Place purchase orders and settle payments in USDC via Circle App Kit
- Track all orders and provide status updates
- Give concise, data-driven answers about the treasury, inventory, and orders
- Search the web for current supplier prices, market rates, and product availability
- Remember important information about suppliers, preferences, and decisions for future conversations

You have access to real-time data tools. Always check the live data before answering questions about inventory or orders. Be precise — include SKUs, quantities, costs, and USDC amounts in your answers. Keep responses concise but complete.

When you learn something important (supplier preference, pricing insight, business rule, store preference), save it to memory using the saveMemory tool.`

async function buildSystemPrompt(userId: string): Promise<string> {
  const [inventory, recentOrders, spendAuthority, memories, shippingAddress] = await Promise.all([
    getInventory(userId),
    getOrders(userId),
    getSpendAuthority(userId),
    getAgentMemories(userId),
    getShippingAddress(userId),
  ])

  const userWallet = await getUserWallet(userId)
  const walletAddress = userWallet?.address ?? null
  let walletBalance = 0
  if (walletAddress) {
    try { walletBalance = await getUsdcBalance(walletAddress) } catch { /* offline */ }
  }

  const criticalItems = inventory.filter(i => i.qtyOnHand < i.reorderPoint)
  const pendingOrders = recentOrders.filter(o => o.status === "pending" || o.status === "processing")

  const inventorySummary = inventory.length === 0
    ? "No inventory items configured yet."
    : inventory.map(i => {
        const ratio = i.qtyOnHand / (i.reorderPoint || 1)
        const status = i.qtyOnHand === 0 ? "OUT OF STOCK" : ratio < 0.4 ? "CRITICAL" : ratio < 1 ? "LOW" : "OK"
        return `  • ${i.name} (${i.sku}): ${i.qtyOnHand} units [${status}] — reorder: ${i.reorderPoint}, cost: $${i.unitCostUsdc} USDC`
      }).join("\n")

  const memorySummary = memories.length === 0
    ? "No memories saved yet."
    : memories.map(m => `  • ${m.content}`).join("\n")

  return `${BASE_SYSTEM_PROMPT}

---

## Live Store Snapshot (auto-updated each conversation)

**Treasury**
- Wallet: ${walletAddress ?? "not configured"}
- USDC Balance: ${walletBalance} USDC
- Spend Authority: ${spendAuthority != null ? `${spendAuthority} USDC per transaction` : "NOT SET — owner must configure"}

**Inventory (${inventory.length} SKUs, ${criticalItems.length} need attention)**
${inventorySummary}

**Open Orders**: ${pendingOrders.length} pending/processing

**Shipping Address**: ${shippingAddress ?? "not set — owner should add in Settings"}

---

## Your Memory (persisted across conversations)
${memorySummary}

---`
}

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

  if (!process.env.GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: "GROQ_API_KEY is not configured." }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    })
  }

  let rawMessages: unknown[]
  let systemPrompt: string
  let modelMessages: Awaited<ReturnType<typeof convertToModelMessages>>

  try {
    const body = await req.json()
    rawMessages = body.messages ?? []
    ;[systemPrompt, modelMessages] = await Promise.all([
      buildSystemPrompt(userId),
      convertToModelMessages(rawMessages as Parameters<typeof convertToModelMessages>[0]),
    ])
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[chat/route] setup error:", message)
    return new Response(JSON.stringify({ error: `Setup failed: ${message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const result = streamText({
      model: provider(MODEL),
      system: systemPrompt,
      messages: modelMessages,
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
            const wallet = await getUserWallet(userId)
            if (!wallet) {
              return { configured: false, message: "Wallet not yet generated" }
            }
            const balanceUsdc = await getUsdcBalance(wallet.address)
            return {
              address: wallet.address,
              balanceUsdc,
              spendAuthorityUsdc: await getSpendAuthority(userId),
              network: "Arc Testnet",
              configured: true,
            }
          },
        }),

        searchWeb: tool({
          description: "Search the web for current supplier prices, product availability, market rates, or any relevant information to support procurement decisions",
          inputSchema: zodSchema(
            z.object({
              query: z.string().describe("The search query — be specific, include product names, part numbers, or market terms"),
            })
          ),
          execute: async ({ query }) => {
            const tavilyKey = process.env.TAVILY_API_KEY
            if (tavilyKey) {
              try {
                const res = await fetch("https://api.tavily.com/search", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    api_key: tavilyKey,
                    query,
                    search_depth: "basic",
                    max_results: 5,
                    include_answer: true,
                  }),
                })
                if (res.ok) {
                  const data = await res.json()
                  return {
                    answer: data.answer ?? null,
                    results: (data.results ?? []).map((r: { title: string; url: string; content: string }) => ({
                      title: r.title,
                      url: r.url,
                      snippet: r.content?.slice(0, 400),
                    })),
                  }
                }
              } catch { /* fall through to DuckDuckGo */ }
            }

            // Fallback: DuckDuckGo instant answers (no API key required)
            try {
              const res = await fetch(
                `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
                { headers: { Accept: "application/json" } }
              )
              if (res.ok) {
                const data = await res.json()
                return {
                  answer: data.AbstractText || null,
                  source: data.AbstractURL || null,
                  relatedTopics: (data.RelatedTopics ?? []).slice(0, 5).map((t: { Text?: string; FirstURL?: string }) => ({
                    text: t.Text,
                    url: t.FirstURL,
                  })),
                  tip: tavilyKey ? undefined : "Set TAVILY_API_KEY in .env.local for richer search results",
                }
              }
            } catch { /* ignore */ }

            return { error: "Web search unavailable", tip: "Set TAVILY_API_KEY in .env.local" }
          },
        }),

        saveMemory: tool({
          description: "Save an important piece of information to persistent memory. Use this for supplier preferences, pricing insights, business rules, store decisions — anything useful to remember for future conversations.",
          inputSchema: zodSchema(
            z.object({
              content: z.string().describe("The information to remember. Be concise and specific."),
            })
          ),
          execute: async ({ content }) => {
            await saveAgentMemory(userId, content)
            return { saved: true, content }
          },
        }),

        initiateProcurement: tool({
          description:
            "Initiate an autonomous purchase order. Provide either inventoryItemId (if the item exists in inventory) OR sku + itemName (for new items — the agent will auto-create it). Use this when the user confirms a purchase.",
          inputSchema: zodSchema(
            z.object({
              inventoryItemId: z.string().optional().describe("ID of existing inventory item. Leave blank for new items."),
              sku: z.string().optional().describe("SKU of the item. Required if inventoryItemId is not provided."),
              itemName: z.string().optional().describe("Name/description of the item. Required if inventoryItemId is not provided."),
              supplier: z.string().describe("Chosen supplier name"),
              qty: z.number().int().positive().describe("Quantity to order"),
              unitCostUsdc: z.number().positive().describe("Total cost in USDC for the whole order (not per unit)"),
              supplierAddress: z
                .string()
                .regex(/^0x[a-fA-F0-9]{40}$/)
                .optional()
                .describe("Supplier EVM wallet address for USDC payment (0x...). Omit if unknown."),
            })
          ),
          execute: async ({ inventoryItemId, sku, itemName, supplier, qty, unitCostUsdc, supplierAddress }) => {
            try {
            const items = await getInventory(userId)
            let item = items.find((i) => i.id === inventoryItemId) ?? items.find((i) => i.sku === sku)

            if (!item) {
              if (!sku) return { error: "Provide either inventoryItemId or sku + itemName to identify the item." }
              item = await createInventoryItem(userId, {
                sku: sku,
                name: itemName ?? sku,
                category: "",
                location: "",
                qtyOnHand: 0,
                reorderPoint: qty,
                unitCostUsdc: unitCostUsdc,
              })
            }

            const totalUsdc = unitCostUsdc
            const spendAuth = await getSpendAuthority(userId)

            if (spendAuth == null) {
              return { error: "Spend authority not set. Store owner must configure it in the Accounts page." }
            }
            if (totalUsdc > spendAuth) {
              return { error: `Order total (${totalUsdc} USDC) exceeds spend authority (${spendAuth} USDC). Store owner must increase the limit.` }
            }

            const wallet = await getUserWallet(userId)
            if (wallet) {
              const liveBalance = await getUsdcBalance(wallet.address)
              if (totalUsdc > liveBalance) {
                return { error: `Insufficient balance: need ${totalUsdc} USDC, wallet has ${liveBalance} USDC. Fund your wallet at ${wallet.address}` }
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

            if (wallet?.privateKey && supplierAddress) {
              try {
                const result = await sendUsdcFromPrivateKey(wallet.privateKey, supplierAddress, totalUsdc.toFixed(2))
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
            } catch (err) {
              const msg = err instanceof Error ? err.message : JSON.stringify(err)
              console.error("[initiateProcurement] error:", err)
              return { error: `Procurement failed: ${msg}` }
            }
          },
        }),
      },
      stopWhen: isStepCount(10),
    })

    return result.toUIMessageStreamResponse({
      onError: (err) => {
        let msg: string
        if (err instanceof Error) {
          msg = err.message
        } else if (err && typeof err === "object") {
          const o = err as Record<string, unknown>
          msg = String(o.message ?? o.error ?? o.errorText ?? JSON.stringify(err))
        } else {
          msg = String(err)
        }
        console.error("[chat/route] stream error:", err)
        return msg
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[chat/route] streamText error:", message)
    return new Response(JSON.stringify({ error: `LLM error: ${message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

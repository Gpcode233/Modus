/**
 * DB-backed data store. All functions are async and scoped to a userId.
 * SQL injection protection is provided by Drizzle ORM's parameterized queries.
 */

import { db, users, inventory, orders, transactions, chatConversations } from "@/lib/db"
import { eq, desc, and, gte, sql } from "drizzle-orm"
import type { InventoryItem, PurchaseOrder, Transaction, OrderTimelineEvent } from "./types"

function uuid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// ---------------------------------------------------------------------------
// User / onboarding
// ---------------------------------------------------------------------------

async function ensureUser(userId: string): Promise<void> {
  await db
    .insert(users)
    .values({ id: userId })
    .onConflictDoNothing()
}

export async function getStoreName(userId: string): Promise<string | null> {
  await ensureUser(userId)
  const row = await db.select({ storeName: users.storeName }).from(users).where(eq(users.id, userId)).limit(1)
  return row[0]?.storeName ?? null
}

export async function isOnboardingComplete(userId: string): Promise<boolean> {
  await ensureUser(userId)
  const row = await db.select({ onboardingComplete: users.onboardingComplete }).from(users).where(eq(users.id, userId)).limit(1)
  return row[0]?.onboardingComplete ?? false
}

export async function completeOnboarding(
  userId: string,
  name: string,
  spendAuth: number,
  seedInventoryItems?: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">[]
): Promise<void> {
  await ensureUser(userId)
  await db
    .update(users)
    .set({ storeName: name, spendAuthorityUsdc: String(spendAuth), onboardingComplete: true, updatedAt: new Date() })
    .where(eq(users.id, userId))

  // Seed demo inventory if provided and user has none yet
  const existing = await db.select({ id: inventory.id }).from(inventory).where(eq(inventory.userId, userId)).limit(1)
  if (existing.length === 0 && seedInventoryItems) {
    for (const item of seedInventoryItems) {
      await db.insert(inventory).values({
        id: `item-${uuid()}`,
        userId,
        sku: item.sku,
        name: item.name,
        category: item.category,
        location: item.location,
        qtyOnHand: item.qtyOnHand,
        reorderPoint: item.reorderPoint,
        unitCostUsdc: String(item.unitCostUsdc),
      })
    }
  }
}

export async function getSpendAuthority(userId: string): Promise<number | null> {
  await ensureUser(userId)
  const row = await db.select({ val: users.spendAuthorityUsdc }).from(users).where(eq(users.id, userId)).limit(1)
  const v = row[0]?.val
  return v != null ? parseFloat(v) : null
}

export async function setSpendAuthority(userId: string, amount: number): Promise<void> {
  await ensureUser(userId)
  await db
    .update(users)
    .set({ spendAuthorityUsdc: String(amount), updatedAt: new Date() })
    .where(eq(users.id, userId))
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
  return rows.map(rowToTransaction)
}

export async function getThirtyDayFlow(userId: string): Promise<{ inbound: number; outbound: number }> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const rows = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.userId, userId), gte(transactions.createdAt, cutoff)))
  const inbound = rows.filter((r) => r.type === "inbound").reduce((s, r) => s + parseFloat(r.amountUsdc), 0)
  const outbound = rows.filter((r) => r.type === "outbound").reduce((s, r) => s + parseFloat(r.amountUsdc), 0)
  return { inbound, outbound }
}

export async function getThirtyDayTrend(userId: string): Promise<{ inbound: number[]; outbound: number[]; dates: string[] }> {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now)
    d.setDate(now.getDate() - (29 - i))
    return d.toISOString().slice(0, 10)
  })

  const cutoff = new Date(now)
  cutoff.setDate(now.getDate() - 29)
  const rows = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.userId, userId), gte(transactions.createdAt, cutoff)))

  const inbound = dates.map((date) =>
    rows.filter((r) => r.type === "inbound" && r.createdAt.toISOString().startsWith(date))
        .reduce((s, r) => s + parseFloat(r.amountUsdc), 0)
  )
  const outbound = dates.map((date) =>
    rows.filter((r) => r.type === "outbound" && r.createdAt.toISOString().startsWith(date))
        .reduce((s, r) => s + parseFloat(r.amountUsdc), 0)
  )
  return { inbound, outbound, dates }
}

export async function recordTransaction(
  userId: string,
  data: Omit<Transaction, "id" | "createdAt">
): Promise<Transaction> {
  await ensureUser(userId)
  const id = `tx-${uuid()}`
  await db.insert(transactions).values({
    id,
    userId,
    type: data.type,
    amountUsdc: String(data.amountUsdc),
    description: data.description,
    txHash: data.txHash,
    blockNumber: data.blockNumber,
    status: data.status,
    orderId: data.orderId,
  })
  const row = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1)
  return rowToTransaction(row[0])
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

export async function getInventory(userId: string): Promise<InventoryItem[]> {
  const rows = await db.select().from(inventory).where(eq(inventory.userId, userId))
  return rows
    .map(rowToInventoryItem)
    .sort((a, b) => a.qtyOnHand / a.reorderPoint - b.qtyOnHand / b.reorderPoint)
}

export async function getInventoryItem(userId: string, id: string): Promise<InventoryItem | undefined> {
  const rows = await db
    .select()
    .from(inventory)
    .where(and(eq(inventory.userId, userId), eq(inventory.id, id)))
    .limit(1)
  return rows[0] ? rowToInventoryItem(rows[0]) : undefined
}

export async function createInventoryItem(
  userId: string,
  data: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">
): Promise<InventoryItem> {
  await ensureUser(userId)
  const id = `item-${uuid()}`
  await db.insert(inventory).values({
    id,
    userId,
    sku: data.sku,
    name: data.name,
    category: data.category,
    location: data.location,
    qtyOnHand: data.qtyOnHand,
    reorderPoint: data.reorderPoint,
    unitCostUsdc: String(data.unitCostUsdc),
  })
  const row = await db.select().from(inventory).where(eq(inventory.id, id)).limit(1)
  return rowToInventoryItem(row[0])
}

export async function updateInventoryItem(
  userId: string,
  id: string,
  data: Partial<Omit<InventoryItem, "id" | "createdAt">>
): Promise<InventoryItem | null> {
  const set: Record<string, unknown> = { updatedAt: new Date() }
  if (data.sku !== undefined) set.sku = data.sku
  if (data.name !== undefined) set.name = data.name
  if (data.category !== undefined) set.category = data.category
  if (data.location !== undefined) set.location = data.location
  if (data.qtyOnHand !== undefined) set.qtyOnHand = data.qtyOnHand
  if (data.reorderPoint !== undefined) set.reorderPoint = data.reorderPoint
  if (data.unitCostUsdc !== undefined) set.unitCostUsdc = String(data.unitCostUsdc)

  await db
    .update(inventory)
    .set(set)
    .where(and(eq(inventory.userId, userId), eq(inventory.id, id)))
  const row = await db.select().from(inventory).where(and(eq(inventory.userId, userId), eq(inventory.id, id))).limit(1)
  return row[0] ? rowToInventoryItem(row[0]) : null
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function getOrders(userId: string): Promise<PurchaseOrder[]> {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
  return rows.map(rowToOrder)
}

export async function getOrder(userId: string, id: string): Promise<PurchaseOrder | undefined> {
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.id, id)))
    .limit(1)
  return rows[0] ? rowToOrder(rows[0]) : undefined
}

export async function createOrder(
  userId: string,
  data: Omit<PurchaseOrder, "id" | "poNumber" | "createdAt" | "updatedAt" | "timeline">
): Promise<PurchaseOrder> {
  await ensureUser(userId)
  const id = `order-${uuid()}`
  const poNumber = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
  const timeline: OrderTimelineEvent[] = [
    { status: "pending", label: "Order Created", timestamp: new Date().toISOString(), note: "Autonomous agent initiated purchase" },
  ]
  await db.insert(orders).values({
    id,
    userId,
    poNumber,
    inventoryItemId: data.inventoryItemId,
    sku: data.sku,
    itemName: data.itemName,
    supplier: data.supplier,
    qty: data.qty,
    unitCostUsdc: String(data.unitCostUsdc),
    totalUsdc: String(data.totalUsdc),
    status: data.status,
    txHash: data.txHash,
    blockNumber: data.blockNumber,
    timeline,
  })
  const row = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
  return rowToOrder(row[0])
}

export async function advanceOrderStatus(
  userId: string,
  id: string,
  status: PurchaseOrder["status"],
  label: string,
  note?: string
): Promise<PurchaseOrder | null> {
  const rows = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.id, id)))
    .limit(1)
  if (!rows[0]) return null

  const timeline = (rows[0].timeline as OrderTimelineEvent[]) ?? []
  timeline.push({ status, label, timestamp: new Date().toISOString(), note })

  await db
    .update(orders)
    .set({ status, timeline, updatedAt: new Date() })
    .where(and(eq(orders.userId, userId), eq(orders.id, id)))

  const updated = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
  return updated[0] ? rowToOrder(updated[0]) : null
}

// ---------------------------------------------------------------------------
// Chat conversations
// ---------------------------------------------------------------------------

export interface StoredConversation {
  id: string
  title: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: Record<string, any>[]
  createdAt: string
  updatedAt: string
}

export async function getChatConversations(userId: string): Promise<StoredConversation[]> {
  await ensureUser(userId)
  const rows = await db
    .select()
    .from(chatConversations)
    .where(eq(chatConversations.userId, userId))
    .orderBy(desc(chatConversations.updatedAt))
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: (r.messages as Record<string, any>[]) ?? [],
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt),
  }))
}

export async function saveChatConversation(userId: string, conv: StoredConversation): Promise<void> {
  await ensureUser(userId)
  await db
    .insert(chatConversations)
    .values({
      id: conv.id,
      userId,
      title: conv.title,
      messages: conv.messages,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
    })
    .onConflictDoUpdate({
      target: chatConversations.id,
      set: {
        title: conv.title,
        messages: conv.messages,
        updatedAt: new Date(conv.updatedAt),
      },
    })
}

export async function deleteChatConversation(userId: string, id: string): Promise<void> {
  await db
    .delete(chatConversations)
    .where(and(eq(chatConversations.userId, userId), eq(chatConversations.id, id)))
}

// ---------------------------------------------------------------------------
// Context strings for AI
// ---------------------------------------------------------------------------

export async function getInventoryContext(userId: string): Promise<string> {
  const items = await getInventory(userId)
  return items
    .map((item) => {
      const ratio = item.qtyOnHand / item.reorderPoint
      const status = ratio < 0.4 ? "CRITICAL" : ratio < 1 ? "LOW" : "OK"
      return `SKU: ${item.sku} | Name: ${item.name} | Qty: ${item.qtyOnHand} | Reorder: ${item.reorderPoint} | Status: ${status} | Cost: $${item.unitCostUsdc} USDC | Location: ${item.location}`
    })
    .join("\n")
}

export async function getOrdersContext(userId: string): Promise<string> {
  const list = await getOrders(userId)
  return list
    .slice(0, 10)
    .map((o) => `PO: ${o.poNumber} | Item: ${o.itemName} | Supplier: ${o.supplier} | Qty: ${o.qty} | Total: ${o.totalUsdc} USDC | Status: ${o.status.toUpperCase()}`)
    .join("\n")
}

// ---------------------------------------------------------------------------
// Row mappers (DB → domain types)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToInventoryItem(row: any): InventoryItem {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category ?? "",
    location: row.location ?? "",
    qtyOnHand: row.qtyOnHand ?? 0,
    reorderPoint: row.reorderPoint ?? 0,
    unitCostUsdc: parseFloat(row.unitCostUsdc ?? "0"),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToOrder(row: any): PurchaseOrder {
  return {
    id: row.id,
    poNumber: row.poNumber,
    inventoryItemId: row.inventoryItemId ?? "",
    sku: row.sku ?? "",
    itemName: row.itemName ?? "",
    supplier: row.supplier ?? "",
    qty: row.qty ?? 0,
    unitCostUsdc: parseFloat(row.unitCostUsdc ?? "0"),
    totalUsdc: parseFloat(row.totalUsdc ?? "0"),
    status: row.status as PurchaseOrder["status"],
    txHash: row.txHash ?? undefined,
    blockNumber: row.blockNumber ?? undefined,
    timeline: (row.timeline as OrderTimelineEvent[]) ?? [],
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTransaction(row: any): Transaction {
  return {
    id: row.id,
    type: row.type as Transaction["type"],
    amountUsdc: parseFloat(row.amountUsdc ?? "0"),
    description: row.description ?? "",
    txHash: row.txHash ?? "",
    blockNumber: row.blockNumber ?? undefined,
    status: row.status as Transaction["status"],
    orderId: row.orderId ?? undefined,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  }
}

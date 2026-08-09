/**
 * In-memory data store. Replace with a real database (e.g. Postgres, Prisma)
 * before production. The exported functions are the data access interface —
 * only the implementation below changes when you swap the backing store.
 */

import type {
  InventoryItem,
  PurchaseOrder,
  Transaction,
} from "./types"

function uuid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

let inventory: InventoryItem[] = [
  {
    id: "item-001",
    sku: "SRV-RACK-42U",
    name: "Server Rack — Dell PowerEdge R750 (42U)",
    category: "Hardware",
    location: "Warehouse A — Aisle 12",
    qtyOnHand: 2,
    reorderPoint: 8,
    unitCostUsdc: 2875,
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-08-06T12:03:41Z",
  },
  {
    id: "item-002",
    sku: "PSU-800W",
    name: "Redundant PSU — 800W Hot-Swap",
    category: "Hardware",
    location: "Warehouse A — Aisle 14",
    qtyOnHand: 6,
    reorderPoint: 10,
    unitCostUsdc: 89,
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-08-05T09:14:00Z",
  },
  {
    id: "item-003",
    sku: "NIC-25G-SFP28",
    name: "25G SFP28 Network Interface Card",
    category: "Networking",
    location: "Warehouse B — Aisle 3",
    qtyOnHand: 5,
    reorderPoint: 12,
    unitCostUsdc: 128,
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-08-04T16:30:00Z",
  },
  {
    id: "item-004",
    sku: "CAB-CAT6A-50M",
    name: "CAT6A Ethernet Cable — 50m",
    category: "Networking",
    location: "Warehouse B — Aisle 7",
    qtyOnHand: 45,
    reorderPoint: 20,
    unitCostUsdc: 18,
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
  },
  {
    id: "item-005",
    sku: "SSD-NVME-4TB",
    name: "NVMe SSD — 4TB PCIe Gen 4",
    category: "Storage",
    location: "Warehouse A — Aisle 8",
    qtyOnHand: 18,
    reorderPoint: 10,
    unitCostUsdc: 340,
    createdAt: "2026-07-10T00:00:00Z",
    updatedAt: "2026-08-03T11:00:00Z",
  },
]

let orders: PurchaseOrder[] = [
  {
    id: "order-001",
    poNumber: "PO-2026-0417",
    inventoryItemId: "item-001",
    sku: "SRV-RACK-42U",
    itemName: "Server Rack — Dell PowerEdge R750 (42U)",
    supplier: "Northline Data Infra",
    qty: 1,
    unitCostUsdc: 500,
    totalUsdc: 500,
    status: "processing",
    txHash: "0x9f2a7b3e4c1d85f6a92b0e7f3c4d1a2b3e4f5c6d7e8f9a0b1c2d3e4f5a6b7c74e",
    blockNumber: 4829117,
    timeline: [
      { status: "pending", label: "Order Created", timestamp: "2026-08-06T12:03:49Z", note: "Agent initiated purchase" },
      { status: "processing", label: "Payment Settled", timestamp: "2026-08-06T12:03:52Z", note: "500 USDC settled on Arc L1 — block #4,829,117" },
    ],
    createdAt: "2026-08-06T12:03:49Z",
    updatedAt: "2026-08-06T12:03:52Z",
  },
  {
    id: "order-002",
    poNumber: "PO-2026-0409",
    inventoryItemId: "item-001",
    sku: "SRV-RACK-42U",
    itemName: "Server Rack — Dell PowerEdge R750 (42U)",
    supplier: "Vantage Rack Systems",
    qty: 1,
    unitCostUsdc: 500,
    totalUsdc: 500,
    status: "in_transit",
    txHash: "0x3d7ca4f2e1b09c8d5e6f7a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2a19f",
    blockNumber: 4826441,
    timeline: [
      { status: "pending", label: "Order Created", timestamp: "2026-08-05T09:14:00Z" },
      { status: "processing", label: "Payment Settled", timestamp: "2026-08-05T09:14:18Z", note: "500 USDC settled on Arc L1" },
      { status: "in_transit", label: "Dispatched by Supplier", timestamp: "2026-08-06T08:00:00Z", note: "Tracking: VR-20260806-7741" },
    ],
    createdAt: "2026-08-05T09:14:00Z",
    updatedAt: "2026-08-06T08:00:00Z",
  },
  {
    id: "order-003",
    poNumber: "PO-2026-0392",
    inventoryItemId: "item-003",
    sku: "NIC-25G-SFP28",
    itemName: "25G SFP28 Network Interface Card",
    supplier: "ColdRow Supply Co",
    qty: 3,
    unitCostUsdc: 128,
    totalUsdc: 384,
    status: "delivered",
    txHash: "0x5e91c3a2b4d6f8e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3b28b",
    blockNumber: 4820192,
    timeline: [
      { status: "pending", label: "Order Created", timestamp: "2026-07-29T14:22:00Z" },
      { status: "processing", label: "Payment Settled", timestamp: "2026-07-29T14:22:09Z" },
      { status: "in_transit", label: "Dispatched", timestamp: "2026-07-30T07:30:00Z" },
      { status: "out_for_delivery", label: "Out for Delivery", timestamp: "2026-08-01T09:00:00Z" },
      { status: "delivered", label: "Delivered", timestamp: "2026-08-01T14:45:00Z", note: "Signed by: J. Chen — Warehouse B" },
    ],
    createdAt: "2026-07-29T14:22:00Z",
    updatedAt: "2026-08-01T14:45:00Z",
  },
]

let transactions: Transaction[] = []

// Set during onboarding. Null = onboarding not yet complete.
let storeName: string | null = null
let onboardingComplete = false

// Set by the store owner via Accounts UI or onboarding. Null = not yet configured.
let spendAuthorityUsdc: number | null = null

// ---------------------------------------------------------------------------
// Data access functions
// ---------------------------------------------------------------------------

export function getStoreName(): string | null {
  return storeName
}

export function isOnboardingComplete(): boolean {
  return onboardingComplete
}

export function completeOnboarding(name: string, spendAuth: number): void {
  storeName = name
  spendAuthorityUsdc = spendAuth
  onboardingComplete = true
}

export function getSpendAuthority(): number | null {
  return spendAuthorityUsdc
}

export function setSpendAuthority(amount: number): void {
  spendAuthorityUsdc = amount
}

export function getTransactions(): Transaction[] {
  return [...transactions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getThirtyDayFlow() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const recent = transactions.filter((t) => new Date(t.createdAt) >= cutoff)
  const inbound = recent.filter((t) => t.type === "inbound").reduce((s, t) => s + t.amountUsdc, 0)
  const outbound = recent.filter((t) => t.type === "outbound").reduce((s, t) => s + t.amountUsdc, 0)
  return { inbound, outbound }
}

export function getThirtyDayTrend() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const dates = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(now)
    date.setDate(now.getDate() - (29 - index))
    return date.toISOString().slice(0, 10)
  })

  const inbound = dates.map((date) =>
    transactions
      .filter((t) => t.type === "inbound" && t.createdAt.startsWith(date))
      .reduce((sum, transaction) => sum + transaction.amountUsdc, 0)
  )

  const outbound = dates.map((date) =>
    transactions
      .filter((t) => t.type === "outbound" && t.createdAt.startsWith(date))
      .reduce((sum, transaction) => sum + transaction.amountUsdc, 0)
  )

  return { inbound, outbound, dates }
}

export function getInventory(): InventoryItem[] {
  return [...inventory].sort((a, b) => {
    const severityA = a.qtyOnHand / a.reorderPoint
    const severityB = b.qtyOnHand / b.reorderPoint
    return severityA - severityB
  })
}

export function getInventoryItem(id: string): InventoryItem | undefined {
  return inventory.find((i) => i.id === id)
}

export function createInventoryItem(
  data: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">
): InventoryItem {
  const item: InventoryItem = {
    ...data,
    id: `item-${uuid()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  inventory.push(item)
  return item
}

export function updateInventoryItem(
  id: string,
  data: Partial<Omit<InventoryItem, "id" | "createdAt">>
): InventoryItem | null {
  const idx = inventory.findIndex((i) => i.id === id)
  if (idx === -1) return null
  inventory[idx] = { ...inventory[idx], ...data, updatedAt: new Date().toISOString() }
  return inventory[idx]
}

export function getOrders(): PurchaseOrder[] {
  return [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getOrder(id: string): PurchaseOrder | undefined {
  return orders.find((o) => o.id === id)
}

export function createOrder(
  data: Omit<PurchaseOrder, "id" | "poNumber" | "createdAt" | "updatedAt" | "timeline">
): PurchaseOrder {
  const poNumber = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
  const order: PurchaseOrder = {
    ...data,
    id: `order-${uuid()}`,
    poNumber,
    timeline: [
      {
        status: "pending",
        label: "Order Created",
        timestamp: new Date().toISOString(),
        note: "Autonomous agent initiated purchase",
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  orders.push(order)
  return order
}

export function advanceOrderStatus(
  id: string,
  status: PurchaseOrder["status"],
  label: string,
  note?: string
): PurchaseOrder | null {
  const idx = orders.findIndex((o) => o.id === id)
  if (idx === -1) return null
  orders[idx].status = status
  orders[idx].timeline.push({ status, label, timestamp: new Date().toISOString(), note })
  orders[idx].updatedAt = new Date().toISOString()
  return orders[idx]
}

export function recordTransaction(
  data: Omit<Transaction, "id" | "createdAt">
): Transaction {
  const tx: Transaction = {
    ...data,
    id: `tx-${uuid()}`,
    createdAt: new Date().toISOString(),
  }
  transactions.push(tx)
  return tx
}

export function getInventoryContext(): string {
  const items = getInventory()
  return items
    .map((item) => {
      const ratio = item.qtyOnHand / item.reorderPoint
      const status = ratio < 0.4 ? "CRITICAL" : ratio < 1 ? "LOW" : "OK"
      return `SKU: ${item.sku} | Name: ${item.name} | Qty: ${item.qtyOnHand} | Reorder point: ${item.reorderPoint} | Status: ${status} | Unit cost: $${item.unitCostUsdc} USDC | Location: ${item.location}`
    })
    .join("\n")
}

export function getOrdersContext(): string {
  const orders = getOrders().slice(0, 10)
  return orders
    .map((o) => `PO: ${o.poNumber} | Item: ${o.itemName} | Supplier: ${o.supplier} | Qty: ${o.qty} | Total: ${o.totalUsdc} USDC | Status: ${o.status.toUpperCase()}`)
    .join("\n")
}

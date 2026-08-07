export type InventoryStatus = "ok" | "low" | "critical"

export interface InventoryItem {
  id: string
  sku: string
  name: string
  category: string
  location: string
  qtyOnHand: number
  reorderPoint: number
  unitCostUsdc: number
  imageUrl?: string
  supplierId?: string
  createdAt: string
  updatedAt: string
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "failed"

export interface OrderTimelineEvent {
  status: OrderStatus
  label: string
  timestamp: string
  note?: string
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  inventoryItemId: string
  sku: string
  itemName: string
  supplier: string
  qty: number
  unitCostUsdc: number
  totalUsdc: number
  status: OrderStatus
  txHash?: string
  blockNumber?: number
  timeline: OrderTimelineEvent[]
  createdAt: string
  updatedAt: string
}

export type TransactionType = "inbound" | "outbound"

export interface Transaction {
  id: string
  type: TransactionType
  amountUsdc: number
  description: string
  txHash: string
  blockNumber?: number
  status: "pending" | "settled" | "failed"
  orderId?: string
  createdAt: string
}

export interface WalletState {
  address: string
  balanceUsdc: number
  spendAuthorityUsdc: number
  network: string
}

export interface AccountsData {
  wallet: WalletState
  inboundThirtyDay: number
  outboundThirtyDay: number
  transactions: Transaction[]
}

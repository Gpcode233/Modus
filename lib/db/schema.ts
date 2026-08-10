import {
  pgTable,
  text,
  boolean,
  numeric,
  integer,
  jsonb,
  timestamp,
  unique,
} from "drizzle-orm/pg-core"

export interface AgentMemoryEntry {
  content: string
  savedAt: string
}

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Privy user ID or "dev:<address>"
  walletAddress: text("wallet_address"),
  walletPrivateKey: text("wallet_private_key"),
  storeName: text("store_name"),
  spendAuthorityUsdc: numeric("spend_authority_usdc"),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  shippingAddress: text("shipping_address"),
  agentMemory: jsonb("agent_memory").default([]).$type<AgentMemoryEntry[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const inventory = pgTable("inventory", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull().default(""),
  location: text("location").notNull().default(""),
  qtyOnHand: integer("qty_on_hand").notNull().default(0),
  reorderPoint: integer("reorder_point").notNull().default(0),
  unitCostUsdc: numeric("unit_cost_usdc").notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  poNumber: text("po_number").notNull(),
  inventoryItemId: text("inventory_item_id").notNull().default(""),
  sku: text("sku").notNull().default(""),
  itemName: text("item_name").notNull().default(""),
  supplier: text("supplier").notNull().default(""),
  qty: integer("qty").notNull().default(0),
  unitCostUsdc: numeric("unit_cost_usdc").notNull().default("0"),
  totalUsdc: numeric("total_usdc").notNull().default("0"),
  status: text("status").notNull().default("pending"),
  txHash: text("tx_hash"),
  blockNumber: integer("block_number"),
  timeline: jsonb("timeline").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "inbound" | "outbound"
  amountUsdc: numeric("amount_usdc").notNull().default("0"),
  description: text("description").notNull().default(""),
  txHash: text("tx_hash").notNull().default(""),
  blockNumber: integer("block_number"),
  status: text("status").notNull().default("settled"),
  orderId: text("order_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const chatRateLimits = pgTable(
  "chat_rate_limits",
  {
    userId: text("user_id").notNull(),
    windowKey: text("window_key").notNull(), // "2026-08-09T14" (hourly)
    count: integer("count").notNull().default(0),
  },
  (t) => ({ uniq: unique().on(t.userId, t.windowKey) })
)

export const chatConversations = pgTable("chat_conversations", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("New conversation"),
  messages: jsonb("messages").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export type DbUser = typeof users.$inferSelect
export type DbInventory = typeof inventory.$inferSelect
export type DbOrder = typeof orders.$inferSelect
export type DbTransaction = typeof transactions.$inferSelect
export type DbChatConversation = typeof chatConversations.$inferSelect

import { db, chatRateLimits } from "@/lib/db"
import { eq, and, sql } from "drizzle-orm"

const DEFAULT_LIMIT = parseInt(process.env.CHAT_RATE_LIMIT ?? "20")

function windowKey(): string {
  // Hourly window: "2026-08-09T14"
  return new Date().toISOString().slice(0, 13)
}

export async function checkChatRateLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const window = windowKey()

  // Upsert: insert or increment
  const result = await db
    .insert(chatRateLimits)
    .values({ userId, windowKey: window, count: 1 })
    .onConflictDoUpdate({
      target: [chatRateLimits.userId, chatRateLimits.windowKey],
      set: { count: sql`chat_rate_limits.count + 1` },
    })
    .returning({ count: chatRateLimits.count })

  const count = result[0]?.count ?? 1
  const remaining = Math.max(0, DEFAULT_LIMIT - count)

  return {
    allowed: count <= DEFAULT_LIMIT,
    remaining,
    limit: DEFAULT_LIMIT,
  }
}

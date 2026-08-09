import { PrivyClient } from "@privy-io/server-auth"
import { cookies } from "next/headers"

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
)

// For API routes — reads Authorization header, privy-token cookie, or dev cookie
export async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const cookieHeader = req.headers.get("cookie") ?? ""

  // 1. Authorization Bearer token
  const auth = req.headers.get("authorization")
  if (auth?.startsWith("Bearer ")) {
    try {
      const { userId } = await privy.verifyAuthToken(auth.slice(7))
      return userId
    } catch {
      // fall through
    }
  }

  // 2. privy-token cookie (same-origin browser requests)
  const privyToken = parseCookie(cookieHeader, "privy-token")
  if (privyToken) {
    try {
      const { userId } = await privy.verifyAuthToken(privyToken)
      return userId
    } catch {}
  }

  // 3. Dev login cookie fallback
  const devUser = parseCookie(cookieHeader, "modus-dev-user")
  if (devUser) return devUser

  return null
}

// For Server Components — reads Next.js cookies()
export async function getUserIdFromCookies(): Promise<string | null> {
  const store = await cookies()

  const devUser = store.get("modus-dev-user")?.value
  if (devUser) return devUser

  const privyToken = store.get("privy-token")?.value
  if (privyToken) {
    try {
      const { userId } = await privy.verifyAuthToken(privyToken)
      return userId
    } catch {}
  }

  return null
}

function parseCookie(header: string, name: string): string | undefined {
  return header
    .split(";")
    .map((c) => c.trim().split("="))
    .find(([k]) => k === name)?.[1]
}

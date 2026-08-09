/**
 * Unified payment layer for Modus.
 *
 * Priority order:
 *  1. Arc Testnet via private key  (ARC_PRIVATE_KEY set)
 *  2. Circle Programmable Wallets  (CIRCLE_API_KEY + CIRCLE_ENTITY_SECRET + CIRCLE_WALLET_ID)
 *  3. Mock / not configured
 */
import { createPublicClient, http, formatUnits } from "viem"
import { arcTestnet } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"

// Arc Testnet — USDC is the native coin (18 decimals), read via getBalance not ERC-20 balanceOf
const ARC_TESTNET_RPC = "https://rpc.testnet.arc.io"
const USDC_DECIMALS = 18


const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(ARC_TESTNET_RPC),
})

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export function isArcConfigured(): boolean {
  return !!process.env.ARC_PRIVATE_KEY
}

export function isCircleConfigured(): boolean {
  return !!(
    process.env.CIRCLE_API_KEY &&
    process.env.CIRCLE_ENTITY_SECRET &&
    process.env.CIRCLE_WALLET_ID
  )
}

export function isPaymentConfigured(): boolean {
  return isArcConfigured() || isCircleConfigured()
}

export function getAgentAddress(): string | null {
  if (process.env.ARC_PRIVATE_KEY) {
    const account = privateKeyToAccount(
      process.env.ARC_PRIVATE_KEY as `0x${string}`
    )
    return account.address
  }
  return process.env.CIRCLE_WALLET_ADDRESS ?? null
}

export function getNetworkName(): string {
  if (isArcConfigured()) return "Arc Testnet"
  if (isCircleConfigured()) return "Base Sepolia"
  return "Arc L1 (not configured)"
}

// ---------------------------------------------------------------------------
// Balance
// ---------------------------------------------------------------------------

export async function getUsdcBalance(address: string): Promise<number> {
  try {
    // USDC is the native coin on Arc (not ERC-20) — read via getBalance
    const raw = await publicClient.getBalance({ address: address as `0x${string}` })
    return parseFloat(formatUnits(raw, USDC_DECIMALS))
  } catch {
    return 0
  }
}

// ---------------------------------------------------------------------------
// Send
// ---------------------------------------------------------------------------

export interface SendResult {
  txHash: string
  explorerUrl: string
  blockNumber?: number
}

export async function sendUsdc(to: string, amount: string): Promise<SendResult> {
  if (isArcConfigured()) return sendUsdcViaArc(to, amount)
  if (isCircleConfigured()) return sendUsdcViaCircle(to, amount)
  throw new Error(
    "No payment method configured. Set ARC_PRIVATE_KEY or CIRCLE_API_KEY + CIRCLE_ENTITY_SECRET + CIRCLE_WALLET_ID."
  )
}

async function sendUsdcViaArc(to: string, amount: string): Promise<SendResult> {
  const { AppKit } = await import("@circle-fin/app-kit")
  const { createViemAdapterFromPrivateKey } = await import("@circle-fin/adapter-viem-v2")

  const adapter = createViemAdapterFromPrivateKey({
    privateKey: process.env.ARC_PRIVATE_KEY as `0x${string}`,
  })

  const kit = new AppKit()
  const result = await kit.send({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    from: { adapter: adapter as any, chain: "Arc_Testnet" },
    to,
    amount,
    token: "USDC",
  })

  if (!result.txHash) throw new Error("Arc payment returned no txHash")
  return {
    txHash: result.txHash,
    explorerUrl:
      result.explorerUrl ?? `https://testnet.arcscan.app/tx/${result.txHash}`,
  }
}

async function sendUsdcViaCircle(to: string, amount: string): Promise<SendResult> {
  const { AppKit } = await import("@circle-fin/app-kit")
  const { createCircleWalletsAdapter } = await import(
    "@circle-fin/adapter-circle-wallets"
  )

  const fromAddress =
    process.env.CIRCLE_WALLET_ADDRESS ??
    (await fetchCircleWalletAddress(process.env.CIRCLE_WALLET_ID!))

  const adapter = createCircleWalletsAdapter({
    apiKey: process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
  })

  const kit = new AppKit()
  const result = await kit.send({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    from: { adapter: adapter as any, chain: "Base_Sepolia", address: fromAddress },
    to,
    amount,
    token: "USDC",
  })

  if (!result.txHash) throw new Error("Circle payment returned no txHash")
  return {
    txHash: result.txHash,
    explorerUrl:
      result.explorerUrl ?? `https://sepolia.basescan.org/tx/${result.txHash}`,
  }
}

// ---------------------------------------------------------------------------
// Circle REST helpers
// ---------------------------------------------------------------------------

const CIRCLE_API = "https://api.circle.com/v1/w3s"

export async function fetchCircleWalletAddress(walletId: string): Promise<string> {
  const res = await fetch(`${CIRCLE_API}/wallets/${walletId}`, {
    headers: { Authorization: `Bearer ${process.env.CIRCLE_API_KEY}` },
  })
  if (!res.ok) throw new Error(`Circle API ${res.status}: ${await res.text()}`)
  const { data } = (await res.json()) as {
    data: { wallet: { address: string } }
  }
  return data.wallet.address
}

export async function fetchCircleWalletBalance(walletId: string): Promise<number> {
  const res = await fetch(`${CIRCLE_API}/wallets/${walletId}/balances`, {
    headers: { Authorization: `Bearer ${process.env.CIRCLE_API_KEY}` },
  })
  if (!res.ok) return 0
  const { data } = (await res.json()) as {
    data: { tokenBalances: Array<{ token: { symbol: string }; amount: string }> }
  }
  const usdc = data.tokenBalances?.find((b) => b.token.symbol === "USDC")
  return parseFloat(usdc?.amount ?? "0")
}

// ---------------------------------------------------------------------------
// x402 — HTTP 402 Payment Required auto-pay
// ---------------------------------------------------------------------------

/**
 * Drop-in fetch wrapper. On 402, reads payment details from X-Payment-Required
 * header, pays via agent wallet, and retries once with X-Payment proof.
 */
export async function x402Fetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const first = await fetch(url, options)
  if (first.status !== 402) return first

  const paymentHeader =
    first.headers.get("X-Payment-Required") ?? first.headers.get("X-402-Payment")
  if (!paymentHeader || !isPaymentConfigured()) return first

  let paymentInfo: { amount?: string; recipient?: string; asset?: string }
  try {
    paymentInfo = JSON.parse(paymentHeader) as typeof paymentInfo
  } catch {
    return first
  }

  if (!paymentInfo.recipient || !paymentInfo.amount) return first

  const { txHash } = await sendUsdc(paymentInfo.recipient, paymentInfo.amount)

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      "X-Payment": JSON.stringify({
        txHash,
        asset: paymentInfo.asset ?? "USDC",
      }),
    },
  })
}

import { createPublicClient, createWalletClient, http, parseAbi } from "viem"
import { arcTestnet } from "viem/chains"
import { privateKeyToAccount } from "viem/accounts"

const IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e" as `0x${string}`
const ARC_TESTNET_RPC = "https://rpc.testnet.arc.io"

const IDENTITY_ABI = parseAbi([
  "function register(string metadataURI) returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
])

const AGENT_METADATA = {
  name: "Modus Procurement Agent",
  description:
    "Autonomous procurement agent that monitors inventory, negotiates with suppliers, and settles payments in USDC on Arc L1.",
  agent_type: "procurement",
  capabilities: [
    "inventory-monitoring",
    "supplier-negotiation",
    "usdc-payments",
    "purchase-orders",
    "arc-l1-settlement",
  ],
  version: "1.0.0",
}

function buildMetadataURI(): string {
  const json = JSON.stringify(AGENT_METADATA)
  const b64 = Buffer.from(json).toString("base64")
  return `data:application/json;base64,${b64}`
}

export interface AgentIdentity {
  registered: boolean
  tokenId: string | null
  address: string
  explorerUrl: string
}

function getClients() {
  if (!process.env.ARC_PRIVATE_KEY) throw new Error("ARC_PRIVATE_KEY not set")
  const account = privateKeyToAccount(process.env.ARC_PRIVATE_KEY as `0x${string}`)
  const publicClient = createPublicClient({ chain: arcTestnet, transport: http(ARC_TESTNET_RPC) })
  const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http(ARC_TESTNET_RPC) })
  return { account, publicClient, walletClient }
}

export async function getAgentIdentity(): Promise<AgentIdentity | null> {
  if (!process.env.ARC_PRIVATE_KEY) return null
  try {
    const { account, publicClient } = getClients()
    const balance = await publicClient.readContract({
      address: IDENTITY_REGISTRY,
      abi: IDENTITY_ABI,
      functionName: "balanceOf",
      args: [account.address],
    })

    if (balance === 0n) {
      return {
        registered: false,
        tokenId: null,
        address: account.address,
        explorerUrl: `https://testnet.arcscan.app/address/${account.address}`,
      }
    }

    let tokenId: string | null = null
    try {
      const id = await publicClient.readContract({
        address: IDENTITY_REGISTRY,
        abi: IDENTITY_ABI,
        functionName: "tokenOfOwnerByIndex",
        args: [account.address, 0n],
      })
      tokenId = id.toString()
    } catch {
      tokenId = "1"
    }

    return {
      registered: true,
      tokenId,
      address: account.address,
      explorerUrl: `https://testnet.arcscan.app/address/${account.address}`,
    }
  } catch {
    return null
  }
}

export async function registerAgentIdentity(): Promise<{ txHash: string; tokenId: string | null }> {
  const { account, publicClient, walletClient } = getClients()

  const balance = await publicClient.readContract({
    address: IDENTITY_REGISTRY,
    abi: IDENTITY_ABI,
    functionName: "balanceOf",
    args: [account.address],
  })

  if (balance > 0n) {
    return { txHash: "already-registered", tokenId: null }
  }

  const metadataURI = buildMetadataURI()

  const hash = await walletClient.writeContract({
    address: IDENTITY_REGISTRY,
    abi: IDENTITY_ABI,
    functionName: "register",
    args: [metadataURI],
    account,
  })

  const receipt = await publicClient.waitForTransactionReceipt({ hash })

  let tokenId: string | null = null
  for (const log of receipt.logs) {
    if (
      log.address.toLowerCase() === IDENTITY_REGISTRY.toLowerCase() &&
      log.topics.length >= 4 &&
      log.topics[3]
    ) {
      tokenId = BigInt(log.topics[3]).toString()
      break
    }
  }

  return { txHash: hash, tokenId }
}

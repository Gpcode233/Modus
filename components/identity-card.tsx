"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { FingerPrintIcon, LinkSquare01Icon, CheckmarkCircle01Icon, Alert01Icon } from "@hugeicons/core-free-icons"

interface Identity {
  registered: boolean
  tokenId: string | null
  address: string
  explorerUrl: string
}

interface Props {
  initialIdentity: Identity | null
  configured: boolean
}

export function IdentityCard({ initialIdentity, configured }: Props) {
  const [identity, setIdentity] = useState<Identity | null>(initialIdentity)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  async function handleRegister() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/agent/register", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Registration failed")
      setTxHash(data.txHash)
      // Refetch identity status
      const idRes = await fetch("/api/agent/identity")
      const idData = await idRes.json()
      if (idData.configured) {
        setIdentity({
          registered: idData.registered,
          tokenId: idData.tokenId ?? null,
          address: idData.address,
          explorerUrl: idData.explorerUrl,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <HugeiconsIcon icon={FingerPrintIcon} size={18} color="currentColor" strokeWidth={1.5} className="text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-900">Agent Identity (ERC-8004)</h2>
      </div>

      {!configured ? (
        <p className="text-sm text-gray-400">
          Wallet not ready. Refresh to register your agent&apos;s onchain identity.
        </p>
      ) : identity?.registered ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color="currentColor" strokeWidth={1.5} className="text-green-500" />
            <span className="text-sm font-medium text-green-700">Registered on Arc Testnet</span>
          </div>
          {identity.tokenId && (
            <p className="text-sm text-gray-600">
              Identity Token <span className="font-mono font-semibold text-gray-900">#{identity.tokenId}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <a
              href={`https://testnet.arcscan.app/address/${identity.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-green-700 hover:text-green-900"
            >
              View agent wallet
              <HugeiconsIcon icon={LinkSquare01Icon} size={12} color="currentColor" strokeWidth={1.5} />
            </a>
            <a
              href={`https://testnet.arcscan.app/token/0x8004A818BFB912233c491871b3d84c89A494BD9e?a=${identity.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-green-700 hover:text-green-900"
            >
              View identity token
              <HugeiconsIcon icon={LinkSquare01Icon} size={12} color="currentColor" strokeWidth={1.5} />
            </a>
          </div>
          {txHash && txHash !== "already-registered" && (
            <a
              href={`https://testnet.arcscan.app/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block font-mono text-xs text-gray-400 hover:text-gray-600"
            >
              Registration tx: {txHash}
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Alert01Icon} size={16} color="currentColor" strokeWidth={1.5} className="text-amber-500" />
            <span className="text-sm text-amber-700">Not registered — agent has no onchain identity yet</span>
          </div>
          <p className="text-xs text-gray-500">
            Registering mints an ERC-8004 identity NFT to the agent wallet, giving it a verifiable onchain reputation on Arc L1.
          </p>
          <button
            onClick={handleRegister}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Registering on-chain…" : "Register Agent Identity"}
          </button>
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}

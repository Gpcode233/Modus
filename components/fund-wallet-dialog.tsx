"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Copy01Icon, LinkSquare01Icon } from "@hugeicons/core-free-icons"

interface Props {
  agentAddress: string
}

export function FundWalletDialog({ agentAddress }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  function copyAddress() {
    navigator.clipboard.writeText(agentAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
      >
        <HugeiconsIcon icon={Add01Icon} size={12} color="currentColor" strokeWidth={2} />
        Fund
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>

        <h2 className="text-base font-semibold text-gray-900">Fund Agent Wallet</h2>
        <p className="mt-1 text-sm text-gray-500">
          Send USDC to the agent wallet address below. The balance updates automatically.
        </p>

        <div className="mt-4">
          <p className="mb-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Agent Wallet Address</p>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
            <span className="flex-1 font-mono text-xs text-gray-800 break-all">{agentAddress}</span>
            <button
              onClick={copyAddress}
              className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <HugeiconsIcon icon={Copy01Icon} size={15} color="currentColor" strokeWidth={1.5} />
            </button>
          </div>
          {copied && (
            <p className="mt-1.5 text-xs text-green-600 font-medium">Copied!</p>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-semibold text-blue-900 mb-1">Getting testnet USDC</p>
          <p className="text-xs text-blue-700">
            Visit the Arc Testnet faucet, paste this address, and request USDC. It arrives in seconds.
          </p>
          <a
            href="https://faucet.circle.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900"
          >
            faucet.circle.com
            <HugeiconsIcon icon={LinkSquare01Icon} size={12} color="currentColor" strokeWidth={1.5} />
          </a>
        </div>

        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold text-gray-700 mb-1">Verify on-chain</p>
          <a
            href={`https://testnet.arcscan.app/address/${agentAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900"
          >
            View wallet on Arc Testnet Explorer
            <HugeiconsIcon icon={LinkSquare01Icon} size={12} color="currentColor" strokeWidth={1.5} />
          </a>
        </div>

        <button
          onClick={() => setOpen(false)}
          className="mt-5 w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}

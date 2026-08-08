"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ShieldKeyIcon, Edit01Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"

interface Props {
  current: number | null
}

export function SpendAuthorityEditor({ current }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(current?.toString() ?? "")
  const [saved, setSaved] = useState(current)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    const amount = parseFloat(value)
    if (isNaN(amount) || amount <= 0) {
      setError("Enter a valid positive amount")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/wallet/spend-authority", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      })
      if (!res.ok) throw new Error("Failed to save")
      setSaved(amount)
      setEditing(false)
    } catch {
      setError("Could not save. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 px-5 py-3">
      <HugeiconsIcon
        icon={ShieldKeyIcon}
        size={18}
        color="currentColor"
        strokeWidth={1.5}
        className="text-green-600 shrink-0"
      />

      {editing ? (
        <div className="flex flex-1 items-center gap-2">
          <span className="text-sm text-green-800 font-semibold shrink-0">Spend authority:</span>
          <div className="flex items-center gap-1">
            <span className="text-sm text-green-700">$</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-28 rounded-lg border border-green-300 bg-white px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false) }}
            />
            <span className="text-sm text-green-700">USDC</span>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => { setEditing(false); setError(null) }}
            className="text-xs text-green-600 hover:text-green-800"
          >
            Cancel
          </button>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-between">
          <p className="text-sm text-green-800">
            {saved != null ? (
              <>
                <span className="font-semibold">Autonomous spend authority:</span>{" "}
                <span className="font-mono">${saved.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC</span>
                {" "}per transaction · enforced by treasury policy
              </>
            ) : (
              <span className="italic text-green-700">Spend authority not set — set a limit before the agent can place orders</span>
            )}
          </p>
          <button
            onClick={() => { setValue(saved?.toString() ?? ""); setEditing(true) }}
            className="ml-4 flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-green-700 hover:bg-green-100 transition-colors shrink-0"
          >
            <HugeiconsIcon icon={Edit01Icon} size={13} color="currentColor" strokeWidth={1.5} />
            {saved != null ? "Edit" : "Set limit"}
          </button>
        </div>
      )}

      {!editing && saved != null && (
        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} color="currentColor" strokeWidth={1.5} className="text-green-500 shrink-0" />
      )}
    </div>
  )
}

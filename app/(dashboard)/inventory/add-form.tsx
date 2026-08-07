"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"

const CATEGORIES = ["Hardware", "Networking", "Storage", "Cooling", "Power", "Accessories", "Other"]

export function AddInventoryForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    sku: "",
    name: "",
    category: "Hardware",
    location: "",
    qtyOnHand: "",
    reorderPoint: "",
    unitCostUsdc: "",
  })

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          qtyOnHand: Number(form.qtyOnHand),
          reorderPoint: Number(form.reorderPoint),
          unitCostUsdc: Number(form.unitCostUsdc),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Something went wrong")
        return
      }
      setOpen(false)
      setForm({ sku: "", name: "", category: "Hardware", location: "", qtyOnHand: "", reorderPoint: "", unitCostUsdc: "" })
      router.refresh()
    } catch {
      setError("Network error — please try again")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
      >
        <HugeiconsIcon icon={Add01Icon} size={16} color="white" strokeWidth={2} />
        Add Item
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Add Inventory Item</h2>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} color="currentColor" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">SKU</label>
                  <input
                    required
                    value={form.sku}
                    onChange={(e) => set("sku", e.target.value)}
                    placeholder="SRV-RACK-42U"
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Item Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Server Rack — Dell PowerEdge R750 (42U)"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-700">Location</label>
                <input
                  required
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="Warehouse A — Aisle 12"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">Qty on Hand</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.qtyOnHand}
                    onChange={(e) => set("qtyOnHand", e.target.value)}
                    placeholder="0"
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">Reorder Point</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.reorderPoint}
                    onChange={(e) => set("reorderPoint", e.target.value)}
                    placeholder="10"
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-700">Unit Cost (USDC)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.unitCostUsdc}
                    onChange={(e) => set("unitCostUsdc", e.target.value)}
                    placeholder="0.00"
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
                >
                  {loading ? "Saving…" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

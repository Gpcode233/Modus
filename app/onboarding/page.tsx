"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type Step = 1 | 2 | 3

interface InventoryDraft {
  name: string
  sku: string
  category: string
  location: string
  qtyOnHand: string
  reorderPoint: string
  unitCostUsdc: string
}

const EMPTY_ITEM: InventoryDraft = {
  name: "",
  sku: "",
  category: "",
  location: "",
  qtyOnHand: "0",
  reorderPoint: "10",
  unitCostUsdc: "",
}

function StepDot({ n, current }: { n: number; current: number }) {
  const done = n < current
  const active = n === current
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
          done
            ? "bg-green-600 text-white"
            : active
            ? "border-2 border-green-600 text-green-600"
            : "border-2 border-gray-200 text-gray-400"
        }`}
      >
        {done ? "✓" : n}
      </div>
      {n < 3 && (
        <div className={`h-px w-12 ${n < current ? "bg-green-600" : "bg-gray-200"}`} />
      )}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [storeName, setStoreName] = useState("")
  const [spendAuthority, setSpendAuthority] = useState("500")
  const [items, setItems] = useState<InventoryDraft[]>([{ ...EMPTY_ITEM }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }])
  }

  function updateItem(idx: number, field: keyof InventoryDraft, value: string) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleFinish() {
    setLoading(true)
    setError(null)
    try {
      const validItems = items.filter((i) => i.name && i.sku && i.unitCostUsdc)
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          spendAuthorityUsdc: parseFloat(spendAuthority),
          inventory: validItems.map((i) => ({
            name: i.name,
            sku: i.sku,
            category: i.category || "General",
            location: i.location || "Warehouse",
            qtyOnHand: parseInt(i.qtyOnHand) || 0,
            reorderPoint: parseInt(i.reorderPoint) || 10,
            unitCostUsdc: parseFloat(i.unitCostUsdc),
          })),
        }),
      })
      if (!res.ok) throw new Error("Setup failed")
      router.push("/accounts")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-xl flex-col gap-6">
        {/* Logo */}
        <div className="flex justify-center">
          <Image src="/modus-logo.png" alt="Modus" width={120} height={48} className="h-12 w-auto object-contain" priority />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0">
          <StepDot n={1} current={step} />
          <StepDot n={2} current={step} />
          <StepDot n={3} current={step} />
        </div>

        {/* Step 1 — Store info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Modus</CardTitle>
              <CardDescription>
                Let&apos;s set up your autonomous procurement agent. First, tell us about your store.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Store name</label>
                <Input
                  placeholder="e.g. Northline Data Supplies"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                />
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!storeName.trim()}
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2 — Spend authority */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Set spend authority</CardTitle>
              <CardDescription>
                The maximum USDC amount the agent can spend per transaction without manual approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Maximum per transaction (USDC)</label>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 focus-within:border-green-400 focus-within:bg-white transition-colors">
                  <span className="text-sm text-gray-400">$</span>
                  <input
                    type="number"
                    min="1"
                    step="50"
                    value={spendAuthority}
                    onChange={(e) => setSpendAuthority(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-gray-900 outline-none"
                  />
                  <span className="text-sm text-gray-400">USDC</span>
                </div>
                <p className="text-xs text-gray-500">
                  You can change this anytime from the Accounts page. Start with a conservative limit.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!spendAuthority || parseFloat(spendAuthority) <= 0}
                  onClick={() => setStep(3)}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 — Inventory */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Add your inventory</CardTitle>
              <CardDescription>
                Add the items your agent will monitor and reorder. You can skip this and add items later from the Inventory page.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {items.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Item {idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 flex flex-col gap-1">
                      <label className="text-xs text-gray-500">Item name *</label>
                      <Input placeholder="e.g. Server Rack 42U" value={item.name} onChange={(e) => updateItem(idx, "name", e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500">SKU *</label>
                      <Input placeholder="SRV-RACK-42U" value={item.sku} onChange={(e) => updateItem(idx, "sku", e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500">Category</label>
                      <Input placeholder="Hardware" value={item.category} onChange={(e) => updateItem(idx, "category", e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500">Qty on hand</label>
                      <Input type="number" min="0" value={item.qtyOnHand} onChange={(e) => updateItem(idx, "qtyOnHand", e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500">Reorder point</label>
                      <Input type="number" min="1" value={item.reorderPoint} onChange={(e) => updateItem(idx, "reorderPoint", e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500">Unit cost (USDC) *</label>
                      <Input type="number" min="0.01" step="0.01" placeholder="0.00" value={item.unitCostUsdc} onChange={(e) => updateItem(idx, "unitCostUsdc", e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500">Location</label>
                      <Input placeholder="Warehouse A" value={item.location} onChange={(e) => updateItem(idx, "location", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 text-sm text-green-700 hover:text-green-900 font-medium"
              >
                + Add another item
              </button>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleFinish}
                  disabled={loading}
                >
                  {loading ? "Launching…" : "Launch Modus"}
                </Button>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="text-center text-xs text-gray-400 hover:text-gray-600"
              >
                Skip for now
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

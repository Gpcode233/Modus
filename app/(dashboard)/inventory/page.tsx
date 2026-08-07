import { HugeiconsIcon } from "@hugeicons/react"
import {
  Package01Icon,
  Alert01Icon,
  CheckmarkCircle01Icon,
  AlertDiamondIcon,
} from "@hugeicons/core-free-icons"
import { getInventory as fetchInventory } from "@/lib/store"
import type { InventoryItem } from "@/lib/types"
import { AddInventoryForm } from "./add-form"

async function getInventory(): Promise<InventoryItem[]> {
  return fetchInventory()
}

function statusConfig(item: InventoryItem) {
  const ratio = item.qtyOnHand / item.reorderPoint
  if (item.qtyOnHand === 0)
    return { label: "Out of Stock", color: "text-red-600", bg: "bg-red-50", icon: AlertDiamondIcon }
  if (ratio < 0.4)
    return { label: "Critical", color: "text-red-600", bg: "bg-red-50", icon: Alert01Icon }
  if (ratio < 1)
    return { label: "Low Stock", color: "text-amber-600", bg: "bg-amber-50", icon: Alert01Icon }
  return { label: "In Stock", color: "text-green-600", bg: "bg-green-50", icon: CheckmarkCircle01Icon }
}

export default async function InventoryPage() {
  const items = await getInventory()

  const critical = items.filter((i) => i.qtyOnHand < i.reorderPoint)

  return (
    <div className="h-full overflow-y-auto flex flex-col gap-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">
            {items.length} items tracked · {critical.length} below reorder threshold
          </p>
        </div>
        <AddInventoryForm />
      </div>

      {/* Items table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Item</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">SKU</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Location</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">Qty</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">Reorder pt.</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">Unit cost</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => {
                const { label, color, bg, icon } = statusConfig(item)
                return (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                          <HugeiconsIcon icon={Package01Icon} size={16} color="currentColor" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-400">{item.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-gray-600">{item.sku}</td>
                    <td className="px-4 py-4 text-xs text-gray-500">{item.location}</td>
                    <td className="px-4 py-4 text-right font-semibold tabular-nums text-gray-900">{item.qtyOnHand}</td>
                    <td className="px-4 py-4 text-right tabular-nums text-gray-500">{item.reorderPoint}</td>
                    <td className="px-4 py-4 text-right tabular-nums text-gray-700">
                      ${item.unitCostUsdc.toLocaleString()} <span className="text-xs text-gray-400">USDC</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${bg} ${color}`}>
                        <HugeiconsIcon icon={icon} size={12} color="currentColor" strokeWidth={1.5} />
                        {label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {items.length === 0 && (
          <p className="px-6 py-10 text-center text-sm text-gray-400">No inventory items yet. Add your first item.</p>
        )}
      </div>
    </div>
  )
}

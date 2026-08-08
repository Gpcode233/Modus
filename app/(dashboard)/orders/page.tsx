import { HugeiconsIcon } from "@hugeicons/react"
import {
  DeliveryTruck01Icon,
  CheckmarkCircle01Icon,
  AlertDiamondIcon,
  DeliveryBox01Icon,
  PackageSearch01Icon,
} from "@hugeicons/core-free-icons"
import { getOrders as fetchOrders } from "@/lib/store"
import type { PurchaseOrder, OrderStatus, OrderTimelineEvent } from "@/lib/types"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"

async function getOrders(): Promise<PurchaseOrder[]> {
  return fetchOrders()
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  pending:           { label: "Pending",           color: "text-gray-600",   bg: "bg-gray-50",   dot: "bg-gray-400" },
  processing:        { label: "Processing",         color: "text-blue-600",   bg: "bg-blue-50",   dot: "bg-blue-500" },
  in_transit:        { label: "In Transit",         color: "text-amber-600",  bg: "bg-amber-50",  dot: "bg-amber-500" },
  out_for_delivery:  { label: "Out for Delivery",   color: "text-purple-600", bg: "bg-purple-50", dot: "bg-purple-500" },
  delivered:         { label: "Delivered",          color: "text-green-600",  bg: "bg-green-50",  dot: "bg-green-500" },
  cancelled:         { label: "Cancelled",          color: "text-gray-500",   bg: "bg-gray-50",   dot: "bg-gray-400" },
  failed:            { label: "Failed",             color: "text-red-600",    bg: "bg-red-50",    dot: "bg-red-500" },
}

const ORDER_STEPS: OrderStatus[] = [
  "pending",
  "processing",
  "in_transit",
  "out_for_delivery",
  "delivered",
]

function stepIndex(status: OrderStatus) {
  return ORDER_STEPS.indexOf(status)
}

function OrderCard({ order }: { order: PurchaseOrder }) {
  const cfg = STATUS_CONFIG[order.status]
  const currentStep = stepIndex(order.status)
  const isFailed = order.status === "failed" || order.status === "cancelled"

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <HugeiconsIcon icon={DeliveryBox01Icon} size={20} color="currentColor" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{order.itemName}</p>
            <p className="text-xs text-gray-500">
              {order.poNumber} · {order.supplier} · {order.qty} unit{order.qty !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          <span className="text-sm font-semibold text-gray-900 tabular-nums">
            {order.totalUsdc.toLocaleString()} <span className="text-xs font-normal text-gray-400">USDC</span>
          </span>
        </div>
      </div>

      {/* Progress bar (only for non-failed orders) */}
      {!isFailed && (
        <div className="mt-5">
          <div className="flex items-center justify-between text-[10px] font-medium text-gray-400 mb-2">
            {ORDER_STEPS.map((step) => (
              <span key={step} className={stepIndex(step) <= currentStep ? "text-green-600" : ""}>
                {STATUS_CONFIG[step].label}
              </span>
            ))}
          </div>
          <div className="relative h-1.5 rounded-full bg-gray-100">
            <div
              className="absolute left-0 top-0 h-1.5 rounded-full bg-green-500 transition-all"
              style={{ width: `${Math.max(4, ((currentStep) / (ORDER_STEPS.length - 1)) * 100)}%` }}
            />
            {ORDER_STEPS.map((step, i) => (
              <div
                key={step}
                className={`absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-white ${
                  i <= currentStep ? "bg-green-500" : "bg-gray-200"
                }`}
                style={{ left: `calc(${(i / (ORDER_STEPS.length - 1)) * 100}% - 6px)` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="mt-5 border-t border-gray-50 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Timeline</p>
        <div className="flex flex-col gap-2">
          {order.timeline.map((event: OrderTimelineEvent, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-50">
                <HugeiconsIcon
                  icon={i === order.timeline.length - 1 ? CheckmarkCircle01Icon : CheckmarkCircle01Icon}
                  size={12}
                  color="#16a34a"
                  strokeWidth={1.5}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-800">{event.label}</p>
                {event.note && <p className="text-xs text-gray-500">{event.note}</p>}
                <p className="text-[11px] text-gray-400">
                  {new Date(event.timestamp).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TX hash */}
      {order.txHash && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 font-mono text-[11px] text-gray-500">
          <span className="shrink-0 text-gray-400">TX:</span>
          <span className="truncate">{order.txHash}</span>
          {order.blockNumber && <span className="shrink-0 text-gray-400">· block #{order.blockNumber.toLocaleString()}</span>}
        </div>
      )}
    </div>
  )
}

export default async function OrdersPage() {
  const orders = await getOrders()

  const active = orders.filter((o) => !["delivered", "cancelled", "failed"].includes(o.status))
  const completed = orders.filter((o) => ["delivered", "cancelled", "failed"].includes(o.status))

  return (
    <div className="h-full overflow-y-auto flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          {active.length} active · {completed.length} completed
        </p>
      </div>

      {orders.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white">
          <Empty className="py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={PackageSearch01Icon} size={18} color="currentColor" strokeWidth={1.5} />
              </EmptyMedia>
              <EmptyTitle>No purchase orders</EmptyTitle>
              <EmptyDescription>
                Orders appear here once the agent places them. Ask the agent in Chat to initiate a procurement.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      )}

      {active.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Active</h2>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {active.map((o) => <OrderCard key={o.id} order={o} />)}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Completed</h2>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {completed.map((o) => <OrderCard key={o.id} order={o} />)}
          </div>
        </section>
      )}
    </div>
  )
}

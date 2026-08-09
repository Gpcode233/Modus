"use client"

import { cn } from "@/lib/utils"

function ChartContainer({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "h-44 w-full rounded-3xl bg-slate-50 p-2 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

export function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-800 shadow-lg">
      <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="text-sm font-semibold">${payload[0].value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    </div>
  )
}

export { ChartContainer }

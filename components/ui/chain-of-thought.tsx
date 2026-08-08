"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

type StepStatus = "pending" | "active" | "complete" | "error"

interface Step {
  label: string
  description?: string
  status: StepStatus
}

interface ChainOfThoughtProps {
  steps: Step[]
  defaultOpen?: boolean
  className?: string
}

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === "complete") {
    return (
      <svg className="h-3.5 w-3.5 text-green-600" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="6" fill="currentColor" fillOpacity={0.15} />
        <path d="M3.5 6l1.8 1.8L8.5 4.2" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (status === "active") {
    return (
      <span className="relative flex h-3.5 w-3.5 items-center justify-center">
        <span className="absolute h-3.5 w-3.5 animate-ping rounded-full bg-green-400 opacity-50" />
        <span className="h-2 w-2 rounded-full bg-green-500" />
      </span>
    )
  }
  if (status === "error") {
    return (
      <svg className="h-3.5 w-3.5 text-red-500" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="6" fill="currentColor" fillOpacity={0.15} />
        <path d="M4 4l4 4M8 4l-4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    )
  }
  // pending
  return <span className="h-2 w-2 rounded-full bg-gray-300" />
}

export function ChainOfThought({ steps, defaultOpen = true, className }: ChainOfThoughtProps) {
  const [open, setOpen] = useState(defaultOpen)
  const activeCount = steps.filter((s) => s.status === "complete").length

  return (
    <div className={cn("rounded-xl border border-gray-100 bg-gray-50 text-xs", className)}>
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <svg
          className={cn("h-3 w-3 shrink-0 text-gray-400 transition-transform", open && "rotate-90")}
          viewBox="0 0 12 12" fill="none"
        >
          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-medium text-gray-500">Chain of thought</span>
        <span className="ml-auto text-gray-400">
          {activeCount}/{steps.length} steps
        </span>
      </button>

      {/* Steps */}
      {open && (
        <div className="border-t border-gray-100 px-3 py-2 flex flex-col gap-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                <StatusIcon status={step.status} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium leading-tight",
                  step.status === "complete" ? "text-gray-600" :
                  step.status === "active" ? "text-gray-800" :
                  "text-gray-400"
                )}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="mt-0.5 text-gray-400 leading-relaxed">{step.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Convert tool invocation parts from AI SDK messages into ChainOfThought steps.
 */
export function toolPartsToSteps(
  parts: Array<{ type: string; toolInvocation?: { toolName: string; state: string; result?: unknown } }>
): Step[] {
  const TOOL_LABELS: Record<string, string> = {
    getInventoryStatus: "Reading inventory",
    getOrderStatus: "Checking orders",
    getWalletBalance: "Fetching wallet balance",
    initiateProcurement: "Executing procurement",
  }

  return parts
    .filter((p) => p.type === "tool-invocation" && p.toolInvocation)
    .map((p) => {
      const inv = p.toolInvocation!
      const label = TOOL_LABELS[inv.toolName] ?? inv.toolName
      const status: StepStatus =
        inv.state === "result" ? "complete" :
        inv.state === "call" ? "active" : "pending"
      return { label, status }
    })
}

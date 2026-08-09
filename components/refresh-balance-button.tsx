"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { ReloadIcon } from "@hugeicons/core-free-icons"

export function RefreshBalanceButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleRefresh() {
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isPending}
      title="Refresh balance"
      className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
    >
      <HugeiconsIcon
        icon={ReloadIcon}
        size={15}
        color="currentColor"
        strokeWidth={1.5}
        className={isPending ? "animate-spin" : ""}
      />
    </button>
  )
}

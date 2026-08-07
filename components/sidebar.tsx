"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Wallet01Icon,
  BubbleChatIcon,
  Package01Icon,
  DeliveryTruck01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/accounts", label: "Accounts", icon: Wallet01Icon },
  { href: "/chat", label: "Chat", icon: BubbleChatIcon },
  { href: "/inventory", label: "Inventory", icon: Package01Icon },
  { href: "/orders", label: "Orders", icon: DeliveryTruck01Icon },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-60 flex-col border-r border-green-100 bg-green-50">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-green-100 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white" stroke="currentColor" strokeWidth={2}>
            <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <span className="text-sm font-semibold text-gray-900">Modus</span>
          <p className="text-[10px] text-green-700">Autonomous Procurement</p>
        </div>
      </div>

      {/* Agent status pill */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <span className="text-xs font-medium text-green-800">Agent Active</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Navigation
        </p>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-green-600 text-white"
                  : "text-gray-600 hover:bg-green-100 hover:text-green-800"
              )}
            >
              <HugeiconsIcon
                icon={item.icon}
                size={18}
                color="currentColor"
                strokeWidth={active ? 2 : 1.5}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom settings */}
      <div className="border-t border-green-100 p-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-green-100 hover:text-green-800 transition-colors"
        >
          <HugeiconsIcon icon={Settings01Icon} size={18} color="currentColor" strokeWidth={1.5} />
          Settings
        </Link>
      </div>
    </aside>
  )
}

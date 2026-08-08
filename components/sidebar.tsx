"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Wallet01Icon,
  BubbleChatIcon,
  Package01Icon,
  DeliveryTruck01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons"
import { usePrivy } from "@privy-io/react-auth"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/accounts", label: "Accounts", icon: Wallet01Icon },
  { href: "/chat", label: "Chat", icon: BubbleChatIcon },
  { href: "/inventory", label: "Inventory", icon: Package01Icon },
  { href: "/orders", label: "Orders", icon: DeliveryTruck01Icon },
]

interface SidebarProps {
  devWalletAddress?: string | null
}

export function Sidebar({ devWalletAddress }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = usePrivy()
  const [storeName, setStoreName] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((d) => { if (d.storeName) setStoreName(d.storeName) })
      .catch(() => {})
  }, [])

  const isDevMode = !!devWalletAddress

  const userEmail = isDevMode
    ? devWalletAddress!
    : (user?.email?.address ??
      user?.google?.email ??
      user?.linkedAccounts.find((a) => a.type === "email")?.address ??
      "Agent")

  const initials = isDevMode
    ? userEmail.slice(2, 4).toUpperCase()
    : userEmail.slice(0, 2).toUpperCase()

  function handleLogout() {
    if (isDevMode) {
      localStorage.removeItem("modus-dev-auth")
      router.push("/login")
    } else {
      logout()
    }
  }

  return (
    <aside className="flex h-full w-60 flex-col border-r border-green-100 bg-green-50">
      {/* Brand */}
      <div className="border-b border-green-100 px-5 py-4">
        <Image
          src="/modus.png"
          alt="Modus"
          width={150}
          height={150}
          className="object-contain"
          priority
        />
        {storeName && (
          <p className="mt-1 truncate text-xs font-medium text-green-800">{storeName}</p>
        )}
      </div>

      {/* Agent status pill */}
      {/* <div className="px-4 py-3">
        <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <span className="text-xs font-medium text-green-800">Agent Active</span>
        </div>
      </div> */}

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {/* <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Navigation
        </p> */}
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

      {/* Bottom */}
      <div className="border-t border-green-100 p-3 flex flex-col gap-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-green-100 hover:text-green-800 transition-colors"
        >
          <HugeiconsIcon icon={Settings01Icon} size={18} color="currentColor" strokeWidth={1.5} />
          Settings
        </Link>
        {/* User row */}
        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${isDevMode ? "bg-amber-500" : "bg-green-600"}`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            {isDevMode && (
              <p className="text-[9px] font-bold uppercase tracking-wide text-amber-600">Dev mode</p>
            )}
            <p className="truncate text-xs font-medium text-gray-700 font-mono">{isDevMode ? `${userEmail.slice(0, 6)}…${userEmail.slice(-4)}` : userEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}

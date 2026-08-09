"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"
import { useEffect } from "react"
import { LoginForm } from "@/components/login-form"
import { HugeiconsIcon } from "@hugeicons/react"
import { Wallet01Icon, ShieldKeyIcon, Robot02Icon } from "@hugeicons/core-free-icons"

export default function SignupPage() {
  const { authenticated, ready } = usePrivy()
  const router = useRouter()

  useEffect(() => {
    if (ready && authenticated) router.push("/accounts")
  }, [ready, authenticated, router])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Branding */}
        <div className="flex flex-col items-center gap-1 self-center">
          <Image
            src="/modus.png"
            alt="Modus"
            width={150}
            height={150}
            className="h-14 w-auto object-contain"
            priority
          />
          <p className="text-xs text-muted-foreground">Autonomous Procurement · Arc L1</p>
        </div>

        {/* What you get */}
        <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-green-700">What you get</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <HugeiconsIcon icon={Wallet01Icon} size={14} color="#16a34a" strokeWidth={1.5} className="shrink-0" />
              <span className="text-xs text-green-800">Arc-compatible wallet created automatically</span>
            </div>
            <div className="flex items-center gap-2.5">
              <HugeiconsIcon icon={Robot02Icon} size={14} color="#16a34a" strokeWidth={1.5} className="shrink-0" />
              <span className="text-xs text-green-800">Autonomous procurement agent for your store</span>
            </div>
            <div className="flex items-center gap-2.5">
              <HugeiconsIcon icon={ShieldKeyIcon} size={14} color="#16a34a" strokeWidth={1.5} className="shrink-0" />
              <span className="text-xs text-green-800">USDC payments on Arc L1 — no gas fees</span>
            </div>
          </div>
        </div>

        <LoginForm mode="signup" />
      </div>
    </div>
  )
}

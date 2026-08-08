"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"
import { useEffect } from "react"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  const { authenticated, ready } = usePrivy()
  const router = useRouter()

  useEffect(() => {
    if (ready && authenticated) router.push("/accounts")
  }, [ready, authenticated, router])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Modus branding */}
        <div className="flex flex-col items-center gap-1 self-center">
          <Image
            src="/modus-logo.png"
            alt="Modus"
            width={140}
            height={56}
            className="h-14 w-auto object-contain"
            priority
          />
          <p className="text-xs text-muted-foreground">Autonomous Procurement · Arc L1</p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"
import { Sidebar } from "@/components/sidebar"
import { LoadingScreen } from "@/components/auth/loading-screen"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { ready, authenticated } = usePrivy()
  const router = useRouter()

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/login")
      return
    }
    if (ready && authenticated) {
      // Check onboarding status
      fetch("/api/onboarding")
        .then((r) => r.json())
        .then((data) => {
          if (!data.complete) router.push("/onboarding")
        })
        .catch(() => {})
    }
  }, [ready, authenticated, router])

  if (!ready || !authenticated) {
    return <LoadingScreen />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}

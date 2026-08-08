"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { usePrivy } from "@privy-io/react-auth"
import { Sidebar } from "@/components/sidebar"
import { LoadingScreen } from "@/components/auth/loading-screen"

const isDev = process.env.NODE_ENV === "development"

function getDevAuth(): string | null {
  if (!isDev || typeof window === "undefined") return null
  return localStorage.getItem("modus-dev-auth")
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { ready, authenticated } = usePrivy()
  const router = useRouter()
  const [devAuth, setDevAuth] = useState<string | null>(null)
  const [devChecked, setDevChecked] = useState(false)

  // Check dev auth on mount (client-only)
  useEffect(() => {
    setDevAuth(getDevAuth())
    setDevChecked(true)
  }, [])

  const isAuthenticated = authenticated || !!devAuth

  useEffect(() => {
    if (!devChecked) return
    if (ready && !isAuthenticated) {
      router.push("/login")
      return
    }
    if (ready && isAuthenticated) {
      fetch("/api/onboarding")
        .then((r) => r.json())
        .then((data) => {
          if (!data.complete) router.push("/onboarding")
        })
        .catch(() => {})
    }
  }, [ready, isAuthenticated, devChecked, router])

  if (!devChecked || !ready || !isAuthenticated) {
    return <LoadingScreen />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar devWalletAddress={devAuth} />
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}

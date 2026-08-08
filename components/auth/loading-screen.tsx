"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

const STEPS = [
  "Signing you in…",
  "Creating your agent wallet…",
  "Dusting the tables…",
  "Connecting to Arc L1…",
  "Loading your inventory…",
  "Checking treasury balance…",
  "Warming up the procurement engine…",
  "Almost there…",
]

export function LoadingScreen() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % STEPS.length)
        setVisible(true)
      }, 300)
    }, 2200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8 bg-white">
      {/* Logo */}
      <Image
        src="/modus-logo.png"
        alt="Modus"
        width={140}
        height={56}
        className="h-14 w-auto object-contain opacity-90"
        priority
      />

      {/* Spinner */}
      <div className="relative flex h-10 w-10 items-center justify-center">
        <div className="absolute h-10 w-10 animate-spin rounded-full border-2 border-green-100 border-t-green-600" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-600" />
      </div>

      {/* Animated status text */}
      <p
        className="text-sm text-gray-400 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {STEPS[index]}
      </p>

      {/* Skeleton preview — three placeholder bars */}
      <div className="flex flex-col gap-2 w-64 opacity-40">
        <div className="h-2 w-full animate-pulse rounded-full bg-gray-100" />
        <div className="h-2 w-4/5 animate-pulse rounded-full bg-gray-100" />
        <div className="h-2 w-3/5 animate-pulse rounded-full bg-gray-100" />
      </div>
    </div>
  )
}

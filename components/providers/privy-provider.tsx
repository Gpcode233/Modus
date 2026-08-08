"use client"

import { PrivyProvider } from "@privy-io/react-auth"
import { arcTestnet } from "viem/chains"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ["email", "google"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: arcTestnet,
        supportedChains: [arcTestnet],
        appearance: {
          // Hide Privy's default modal — we use headless hooks only
          showWalletLoginFirst: false,
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}

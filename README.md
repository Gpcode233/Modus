# Modus

**Autonomous Procurement, Powered by USDC.**

Built for the Arc Hackathon — Agentic Economy track.

## What is Modus?

Modus is an autonomous procurement agent that eliminates manual purchase-order
workflows. Instead of a human tracking inventory levels, emailing suppliers
for quotes, and manually cutting checks or wires, Modus closes the entire
loop on its own:

1. **Monitor** — Modus continuously watches inventory levels against
   configured reorder points (e.g. server racks, PSUs, network hardware).
2. **Decide** — when a critical threshold is breached, Modus autonomously
   queries multiple suppliers, evaluates quotes on cost, lead time, and
   reliability, and selects a winner.
3. **Pay** — Modus settles the purchase instantly and programmatically in
   **USDC on Arc L1**, using **Circle's App Kits** for wallet and payment
   infrastructure — no manual approval, no wire transfer, no net-30 float.

Under the hood, Modus is composed of three layers:

- **Arc L1** — a high-throughput blockchain purpose-built for stablecoin
  settlement, giving Modus fast, low-cost, final payment rails for every
  autonomous transaction.
- **Circle App Kits** — handle treasury wallet management and USDC transfers,
  so Modus can hold, spend, and reconcile stablecoin balances without
  custom payment infrastructure.
- **Agent Stack** — powers the autonomous decision logic: interpreting
  inventory signals, negotiating across supplier quotes, and deciding when
  and how much to pay, within a fixed per-transaction spend authority.

The result is a procurement pipeline that runs end-to-end without a human in
the loop — from "we're low on server racks" to "payment settled on-chain" in
seconds.

## Dashboard

The included dashboard (`app/page.tsx`) is a live look at Modus in action:

- **Treasury Wallet** — the agent's USDC balance on Arc L1, recent inbound /
  outbound flow, and its configured autonomous spend authority.
- **Critical Inventory Flags** — items (like a server rack SKU) that have
  dropped below their reorder point and are candidates for autonomous
  purchasing.
- **Agentic Decision Engine** — a terminal-style log showing the agent
  querying suppliers in real time, selecting a winner, and initiating a
  500 USDC payment on Arc L1.

> This is a hackathon prototype. Wallet balances, inventory data, and the
> decision log are mocked in the UI to demonstrate the intended product
> experience — they are not yet wired to live Arc L1 or Circle
> infrastructure.

## Tech Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com)
- [lucide-react](https://lucide.dev) for icons

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser to
view the dashboard.

To create a production build:

```bash
npm run build
npm run start
```

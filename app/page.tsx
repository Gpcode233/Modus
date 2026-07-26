import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Server,
  Terminal,
  ShieldCheck,
  Zap,
} from "lucide-react";

type InventoryFlag = {
  sku: string;
  name: string;
  location: string;
  qtyRemaining: number;
  reorderPoint: number;
  severity: "critical" | "warning";
};

type LogLine = {
  time: string;
  tag: string;
  text: string;
  tone: "info" | "success" | "action" | "warn";
};

const inventoryFlags: InventoryFlag[] = [
  {
    sku: "SRV-RACK-42U",
    name: "Server Rack — Dell PowerEdge R750 (42U)",
    location: "Warehouse A — Aisle 12",
    qtyRemaining: 2,
    reorderPoint: 8,
    severity: "critical",
  },
  {
    sku: "PSU-800W",
    name: "Redundant PSU — 800W Hot-Swap",
    location: "Warehouse A — Aisle 14",
    qtyRemaining: 6,
    reorderPoint: 10,
    severity: "warning",
  },
  {
    sku: "NIC-25G-SFP28",
    name: "25G SFP28 Network Interface Card",
    location: "Warehouse B — Aisle 3",
    qtyRemaining: 5,
    reorderPoint: 12,
    severity: "warning",
  },
];

const decisionLog: LogLine[] = [
  { time: "12:03:41", tag: "MONITOR", text: 'Inventory threshold breached for SKU "SRV-RACK-42U" — 2 units remaining (reorder point: 8)', tone: "warn" },
  { time: "12:03:42", tag: "QUERY", text: "Broadcasting RFQ to 4 pre-approved suppliers for 42U server rack enclosures...", tone: "info" },
  { time: "12:03:44", tag: "SUPPLIER", text: "Quote received — Vantage Rack Systems: $2,940.00 / unit, 5-day lead time", tone: "info" },
  { time: "12:03:45", tag: "SUPPLIER", text: "Quote received — Northline Data Infra: $2,875.00 / unit, 6-day lead time", tone: "info" },
  { time: "12:03:45", tag: "SUPPLIER", text: "Quote received — ColdRow Supply Co: $3,100.00 / unit, 3-day lead time", tone: "info" },
  { time: "12:03:47", tag: "DECISION", text: "Evaluating suppliers on cost, lead time, and reliability score (0.94 threshold)...", tone: "info" },
  { time: "12:03:48", tag: "DECISION", text: "Selected: Northline Data Infra — best cost-adjusted score (0.97), lead time within SLA", tone: "success" },
  { time: "12:03:49", tag: "ACTION", text: "Initiating payment: 500.00 USDC deposit to Northline Data Infra on Arc L1", tone: "action" },
  { time: "12:03:50", tag: "ARC L1", text: "Tx broadcast — hash 0x9f2a...c74e — confirming...", tone: "info" },
  { time: "12:03:52", tag: "ARC L1", text: "Tx confirmed in block #4,829,117 — 500.00 USDC settled", tone: "success" },
  { time: "12:03:52", tag: "ACTION", text: 'Purchase order PO-2026-0417 issued and marked "AWAITING FULFILLMENT"', tone: "success" },
];

function toneClasses(tone: LogLine["tone"]) {
  switch (tone) {
    case "success":
      return "text-emerald-400";
    case "action":
      return "text-cyan-300";
    case "warn":
      return "text-amber-400";
    default:
      return "text-zinc-400";
  }
}

export default function Home() {
  return (
    <div className="flex-1 bg-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 sm:px-10">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-zinc-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <Zap className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
                Modus
              </h1>
              <p className="text-sm text-zinc-500">
                Autonomous Procurement, Powered by USDC.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Agent Active — Monitoring Inventory
          </div>
        </header>

        {/* Top row: Treasury + Inventory */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Treasury Wallet */}
          <section className="lg:col-span-2 flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-400">
                <Wallet className="h-4 w-4" />
                <h2 className="text-sm font-medium uppercase tracking-wide">
                  Treasury Wallet
                </h2>
              </div>
              <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
                Arc L1
              </span>
            </div>

            <div className="mt-6">
              <p className="text-xs text-zinc-500">USDC Balance</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight text-zinc-50">
                48,320.00{" "}
                <span className="text-lg font-medium text-zinc-500">USDC</span>
              </p>
              <p className="mt-1 font-mono text-xs text-zinc-600">
                0x71C7...9aE2 · Circle App Kit
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4">
              <div>
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <ArrowDownRight className="h-3.5 w-3.5 text-emerald-400" />
                  Inbound (30d)
                </div>
                <p className="mt-1 text-sm font-semibold text-zinc-100">
                  +62,000.00 USDC
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <ArrowUpRight className="h-3.5 w-3.5 text-rose-400" />
                  Outbound (30d)
                </div>
                <p className="mt-1 text-sm font-semibold text-zinc-100">
                  −38,240.00 USDC
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-zinc-800/60 px-3 py-2 text-xs text-zinc-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Spend authority: 500 USDC per autonomous transaction
            </div>
          </section>

          {/* Critical Inventory Flags */}
          <section className="lg:col-span-3 flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
            <div className="flex items-center gap-2 text-zinc-400">
              <AlertTriangle className="h-4 w-4" />
              <h2 className="text-sm font-medium uppercase tracking-wide">
                Critical Inventory Flags
              </h2>
            </div>

            <ul className="mt-4 flex flex-col divide-y divide-zinc-800">
              {inventoryFlags.map((item) => (
                <li
                  key={item.sku}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                        item.severity === "critical"
                          ? "bg-rose-500/10 text-rose-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      <Server className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        {item.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {item.sku} · {item.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        item.severity === "critical"
                          ? "bg-rose-500/10 text-rose-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {item.severity === "critical" ? "CRITICAL" : "LOW STOCK"}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {item.qtyRemaining} / {item.reorderPoint} reorder pt.
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Agentic Decision Engine */}
        <section className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <div className="flex items-center gap-2 text-zinc-400">
            <Terminal className="h-4 w-4" />
            <h2 className="text-sm font-medium uppercase tracking-wide">
              Agentic Decision Engine
            </h2>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg bg-black p-4 font-mono text-xs leading-relaxed shadow-inner ring-1 ring-zinc-800 sm:text-sm">
            <div className="mb-2 flex items-center gap-1.5 border-b border-zinc-800 pb-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
              <span className="ml-2 text-zinc-600">modus-agent — decision-log</span>
            </div>
            {decisionLog.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap">
                <span className="text-zinc-600">[{line.time}]</span>{" "}
                <span className="text-zinc-500">{line.tag.padEnd(8, " ")}</span>{" "}
                <span className={toneClasses(line.tone)}>{line.text}</span>
              </div>
            ))}
            <div className="mt-1 flex items-center gap-1 text-emerald-400">
              <span>$</span>
              <span className="h-4 w-2 animate-pulse bg-emerald-400" />
            </div>
          </div>
        </section>

        <footer className="pb-4 text-center text-xs text-zinc-600">
          Modus — built for the Arc Hackathon, Agentic Economy track. Powered
          by Arc L1, Circle App Kit, and Agent Stack.
        </footer>
      </div>
    </div>
  );
}

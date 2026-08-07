"use client"

import { useState } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  Robot01Icon,
  Key01Icon,
  Notification01Icon,
  CheckmarkCircle01Icon,
  EyeIcon,
  ViewOffSlashIcon,
  Dollar01Icon,
  ToggleOnIcon,
  ToggleOffIcon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

interface SettingsFormProps {
  walletAddress: string
  network: string
  spendAuthority: number
}

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: IconSvgElement
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50">
          <HugeiconsIcon icon={icon} size={18} color="#16a34a" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  )
}

function ApiKeyInput({ label, hint, placeholder }: { label: string; hint?: string; placeholder: string }) {
  const [visible, setVisible] = useState(false)
  const [value, setValue] = useState("")

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 transition-colors focus-within:border-green-400 focus-within:bg-white">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none font-mono"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="shrink-0 text-gray-400 transition-colors hover:text-gray-600"
        >
          <HugeiconsIcon
            icon={visible ? ViewOffSlashIcon : EyeIcon}
            size={16}
            color="currentColor"
            strokeWidth={1.5}
          />
        </button>
      </div>
    </Field>
  )
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="transition-colors">
      <HugeiconsIcon
        icon={enabled ? ToggleOnIcon : ToggleOffIcon}
        size={28}
        color={enabled ? "#16a34a" : "#d1d5db"}
        strokeWidth={1.5}
      />
    </button>
  )
}

export function SettingsForm({ walletAddress, network, spendAuthority }: SettingsFormProps) {
  const [authority, setAuthority] = useState(String(spendAuthority))
  const [threshold, setThreshold] = useState("40")
  const [lowStockAlerts, setLowStockAlerts] = useState(true)
  const [criticalOnly, setCriticalOnly] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Agent Configuration */}
      <SectionCard
        icon={Robot01Icon}
        title="Agent Configuration"
        description="Control how the Modus agent makes autonomous purchasing decisions"
      >
        <div className="flex flex-col gap-5">
          <Field
            label="Spend Authority (USDC per transaction)"
            hint="Agent can autonomously settle payments up to this amount without manual approval"
          >
            <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 transition-colors focus-within:border-green-400 focus-within:bg-white">
              <HugeiconsIcon icon={Dollar01Icon} size={15} color="#9ca3af" strokeWidth={1.5} />
              <input
                type="number"
                min={0}
                max={10000}
                step={50}
                value={authority}
                onChange={(e) => setAuthority(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
              />
              <span className="shrink-0 text-xs font-medium text-gray-400">USDC</span>
            </div>
          </Field>

          <Field
            label="Auto-reorder Trigger (%)"
            hint="Trigger autonomous reorder when stock falls below this percentage of the reorder point"
          >
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="flex-1 accent-green-600"
              />
              <span className="w-12 shrink-0 text-right text-sm font-semibold text-green-700">
                {threshold}%
              </span>
            </div>
          </Field>
        </div>
      </SectionCard>

      {/* Wallet & Treasury */}
      <SectionCard
        icon={Key01Icon}
        title="API Keys"
        description="Connect to Anthropic and Circle App Kit for AI and USDC payment functionality"
      >
        <div className="flex flex-col gap-5">
          <ApiKeyInput
            label="Anthropic API Key"
            hint="Required for Claude-powered procurement agent"
            placeholder="sk-ant-…"
          />
          <ApiKeyInput
            label="Circle API Key"
            hint="Required for USDC payments on Arc L1 via Circle App Kit"
            placeholder="TEST_API_KEY:…"
          />
          <Field label="Circle Wallet ID" hint="Your Circle programmable wallet identifier">
            <input
              type="text"
              placeholder="wallet_…"
              className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-mono text-gray-800 placeholder-gray-400 outline-none transition-colors focus:border-green-400 focus:bg-white"
            />
          </Field>
        </div>
      </SectionCard>

      {/* Wallet info (read-only) */}
      <SectionCard
        icon={Robot01Icon}
        title="Wallet & Network"
        description="Current treasury wallet connected to Arc L1 via Circle App Kit"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Wallet Address</p>
              <p className="mt-0.5 font-mono text-sm text-gray-700">{walletAddress}</p>
            </div>
            <span className="rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Network</p>
              <p className="mt-0.5 text-sm font-medium text-gray-700">{network}</p>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
              {network}
            </span>
          </div>
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard
        icon={Notification01Icon}
        title="Notifications"
        description="Configure alerts for inventory levels and order status changes"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Low stock alerts</p>
              <p className="text-xs text-gray-500">Notify when inventory falls below reorder point</p>
            </div>
            <Toggle enabled={lowStockAlerts} onToggle={() => setLowStockAlerts((v) => !v)} />
          </div>
          <hr className="border-gray-100" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Critical only</p>
              <p className="text-xs text-gray-500">Only alert when stock is below 40% of reorder point</p>
            </div>
            <Toggle enabled={criticalOnly} onToggle={() => setCriticalOnly((v) => !v)} />
          </div>
        </div>
      </SectionCard>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className={cn(
            "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",
            saved
              ? "bg-green-100 text-green-700"
              : "bg-green-600 text-white hover:bg-green-700 active:scale-95"
          )}
        >
          <HugeiconsIcon
            icon={CheckmarkCircle01Icon}
            size={16}
            color="currentColor"
            strokeWidth={2}
          />
          {saved ? "Saved!" : "Save settings"}
        </button>
      </div>
    </div>
  )
}

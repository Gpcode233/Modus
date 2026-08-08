"use client"

import { useChat } from "@ai-sdk/react"
import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BubbleChatSparkIcon,
  ArrowRight01Icon,
  User02Icon,
  AiSettingIcon,
  Add01Icon,
  MoreVerticalIcon,
  Copy01Icon,
  Download01Icon,
  Share01Icon,
  Delete01Icon,
  SidebarLeft01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { ChainOfThought, toolPartsToSteps } from "@/components/ui/chain-of-thought"
import {
  type Conversation,
  getConversations,
  saveConversation,
  deleteConversation,
  makeTitle,
} from "./chat-store"
import type { Message } from "@ai-sdk/react"

const SUGGESTIONS = [
  "What inventory items are critically low?",
  "What's the status of recent orders?",
  "Show me my wallet balance and spend authority",
  "Place an order for 10 units of PSU-800W from the cheapest supplier",
]

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export default function ChatPage() {
  const [convId, setConvId] = useState(newId)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [historyOpen, setHistoryOpen] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, append, setMessages } =
    useChat({ api: "/api/chat" })

  // Load history from localStorage on mount
  useEffect(() => {
    setConversations(getConversations())
  }, [])

  // Persist conversation whenever messages change
  useEffect(() => {
    if (messages.length === 0) return
    const existing = getConversations().find((c) => c.id === convId)
    const conv: Conversation = {
      id: convId,
      title: makeTitle(messages),
      messages: messages,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveConversation(conv)
    setConversations(getConversations())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  // Close menu on outside click
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [])

  function startNewConversation() {
    setConvId(newId())
    setMessages([])
  }

  function loadConversation(conv: Conversation) {
    setConvId(conv.id)
    // UIMessage[] serialised and re-hydrated; Message[] is compatible at runtime
    setMessages(conv.messages as unknown as Message[])
  }

  function handleDeleteConv(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    deleteConversation(id)
    setConversations(getConversations())
    if (id === convId) startNewConversation()
  }

  function copyConversation() {
    const text = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => {
        const label = m.role === "user" ? "You" : "Modus"
        const content = typeof m.content === "string" ? m.content : "[tool result]"
        return `${label}: ${content}`
      })
      .join("\n\n")
    navigator.clipboard.writeText(text)
    setMenuOpen(false)
  }

  function exportConversation() {
    const sections = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => {
        const label = m.role === "user" ? "**You**" : "**Modus Agent**"
        const content = typeof m.content === "string" ? m.content : "*[tool result]*"
        return `${label}\n\n${content}`
      })
    const md = `# Modus Chat Export\n\n${sections.join("\n\n---\n\n")}`
    const blob = new Blob([md], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `modus-chat-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
    setMenuOpen(false)
  }

  function shareConversation() {
    const text = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => {
        const label = m.role === "user" ? "You" : "Modus"
        const content = typeof m.content === "string" ? m.content : "[tool result]"
        return `${label}: ${content}`
      })
      .join("\n\n")
    if (navigator.share) {
      navigator.share({ title: "Modus Chat", text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text)
    }
    setMenuOpen(false)
  }

  function sendSuggestion(text: string) {
    append({ role: "user", content: text })
  }

  return (
    <div className="flex h-full">
      {/* ── History Sub-Sidebar ── */}
      {historyOpen && (
        <aside className="flex w-60 shrink-0 flex-col border-r border-gray-100 bg-gray-50/50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Clock01Icon} size={15} color="#9ca3af" strokeWidth={1.5} />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                History
              </span>
            </div>
            <button
              onClick={startNewConversation}
              title="New conversation"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
            >
              <HugeiconsIcon icon={Add01Icon} size={15} color="currentColor" strokeWidth={1.5} />
            </button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto py-2">
            {conversations.length === 0 ? (
              <p className="px-4 py-4 text-center text-xs text-gray-400">No past conversations</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => loadConversation(conv)}
                  className={cn(
                    "group mx-2 flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors",
                    conv.id === convId
                      ? "bg-green-50 text-green-700"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <HugeiconsIcon
                    icon={BubbleChatSparkIcon}
                    size={13}
                    color={conv.id === convId ? "#16a34a" : "#d1d5db"}
                    strokeWidth={1.5}
                  />
                  <span className="flex-1 truncate text-xs leading-relaxed">{conv.title}</span>
                  <button
                    onClick={(e) => handleDeleteConv(conv.id, e)}
                    title="Delete conversation"
                    className="hidden h-5 w-5 items-center justify-center rounded text-gray-400 transition-colors hover:text-red-500 group-hover:flex"
                  >
                    <HugeiconsIcon icon={Delete01Icon} size={12} color="currentColor" strokeWidth={1.5} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* ── Main Chat Area ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3.5">
          {/* History toggle */}
          <button
            onClick={() => setHistoryOpen((o) => !o)}
            title={historyOpen ? "Hide history" : "Show history"}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <HugeiconsIcon icon={SidebarLeft01Icon} size={18} color="currentColor" strokeWidth={1.5} />
          </button>

          {/* Agent identity */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600">
            <HugeiconsIcon icon={BubbleChatSparkIcon} size={18} color="white" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Modus Agent</h1>
            <p className="text-xs text-gray-500">Autonomous procurement AI · Arc L1 · Claude</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Online badge */}
            <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              <span className="text-xs font-medium text-green-700">Online</span>
            </div>

            {/* Three-dot menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                disabled={messages.length === 0}
                title="More options"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
              >
                <HugeiconsIcon icon={MoreVerticalIcon} size={18} color="currentColor" strokeWidth={1.5} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-10 z-50 min-w-[13.5rem] rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                  <button
                    onClick={copyConversation}
                    className="flex w-full items-center gap-3 whitespace-nowrap px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <HugeiconsIcon icon={Copy01Icon} size={15} color="#6b7280" strokeWidth={1.5} />
                    Copy conversation
                  </button>
                  <button
                    onClick={exportConversation}
                    className="flex w-full items-center gap-3 whitespace-nowrap px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <HugeiconsIcon icon={Download01Icon} size={15} color="#6b7280" strokeWidth={1.5} />
                    Export as Markdown
                  </button>
                  <button
                    onClick={shareConversation}
                    className="flex w-full items-center gap-3 whitespace-nowrap px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <HugeiconsIcon icon={Share01Icon} size={15} color="#6b7280" strokeWidth={1.5} />
                    Share
                  </button>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={() => {
                      startNewConversation()
                      setMenuOpen(false)
                    }}
                    className="flex w-full items-center gap-3 whitespace-nowrap px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <HugeiconsIcon icon={Add01Icon} size={15} color="#6b7280" strokeWidth={1.5} />
                    New conversation
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-8 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600">
                <HugeiconsIcon icon={BubbleChatSparkIcon} size={24} color="white" strokeWidth={1.5} />
              </div>
              <p className="mt-2 text-sm font-medium text-gray-700">Modus Agent is ready</p>
              <p className="text-xs text-gray-400">
                Ask me about inventory, orders, or wallet status — or instruct me to take action.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex items-start gap-3", msg.role === "user" && "flex-row-reverse")}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  msg.role === "assistant" ? "bg-green-600" : "bg-gray-200"
                )}
              >
                <HugeiconsIcon
                  icon={msg.role === "assistant" ? AiSettingIcon : User02Icon}
                  size={16}
                  color={msg.role === "assistant" ? "white" : "#6b7280"}
                  strokeWidth={1.5}
                />
              </div>

              <div className={cn("max-w-lg flex flex-col gap-1.5", msg.role === "user" && "items-end")}>
                {(() => {
                  const parts = msg.parts
                  if (!parts) {
                    return (
                      <div className={cn(
                        "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                        msg.role === "assistant" ? "bg-gray-50 text-gray-800" : "bg-green-600 text-white"
                      )}>
                        {msg.content}
                      </div>
                    )
                  }

                  // Collect tool invocation parts for chain-of-thought
                  const toolParts = parts.filter((p) => p.type === "tool-invocation")
                  const steps = toolPartsToSteps(
                    toolParts as Array<{ type: string; toolInvocation?: { toolName: string; state: string } }>
                  )

                  return (
                    <>
                      {steps.length > 0 && (
                        <ChainOfThought steps={steps} defaultOpen={steps.some((s) => s.status !== "complete")} />
                      )}
                      {parts.map((part, i) => {
                        if (part.type === "text" && part.text.trim()) {
                          return (
                            <div
                              key={i}
                              className={cn(
                                "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                                msg.role === "assistant" ? "bg-gray-50 text-gray-800" : "bg-green-600 text-white"
                              )}
                            >
                              {part.text}
                            </div>
                          )
                        }
                        return null
                      })}
                    </>
                  )
                })()}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600">
                <HugeiconsIcon icon={AiSettingIcon} size={16} color="white" strokeWidth={1.5} />
              </div>
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 px-8 pb-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendSuggestion(s)}
                className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-100 px-8 py-4">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 transition-colors focus-within:border-green-400 focus-within:bg-white"
          >
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask the agent anything..."
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-white transition-colors hover:bg-green-700 disabled:opacity-40"
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="white" strokeWidth={2} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

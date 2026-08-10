"use client"

import { useChat } from "@ai-sdk/react"
import { useEffect, useRef, useState, Fragment } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BubbleChatSparkIcon,
  Robot02Icon,
  Add01Icon,
  MoreVerticalIcon,
  Copy01Icon,
  Download01Icon,
  Share01Icon,
  Delete01Icon,
  Clock01Icon,
  Alert01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { ChainOfThought, toolPartsToSteps } from "@/components/ui/chain-of-thought"
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message"
import { ConversationEmptyState } from "@/components/ai-elements/conversation"
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller"
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input"
import {
  type Conversation as ConvType,
  getConversations,
  saveConversation,
  deleteConversation,
  makeTitle,
} from "./chat-store"
import type { UIMessage } from "ai"

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
  const [conversations, setConversations] = useState<ConvType[]>([])
  const [historyOpen, setHistoryOpen] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const { messages, status, append, setMessages, stop, error } = useChat({
    api: "/api/chat",
    onError: (err) => {
      setErrorMsg(err.message)
      toast.error(err.message, { id: "chat-error" })
    },
  })

  const isLoading = status === "submitted" || status === "streaming"

  // Load conversations from DB on mount
  useEffect(() => {
    getConversations().then(setConversations).catch(() => {})
  }, [])

  // Persist conversation whenever messages change
  useEffect(() => {
    if (messages.length === 0) return
    const conv: ConvType = {
      id: convId,
      title: makeTitle(messages as UIMessage[]),
      messages: messages as UIMessage[],
      createdAt: conversations.find((c) => c.id === convId)?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    // Update local state immediately
    setConversations((prev) => [conv, ...prev.filter((c) => c.id !== convId)])
    // Persist to DB in background
    saveConversation(conv).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages])

  // Clear error when user starts typing (new message)
  useEffect(() => {
    if (isLoading) setErrorMsg(null)
  }, [isLoading])

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
    setErrorMsg(null)
  }

  function loadConversation(conv: ConvType) {
    setConvId(conv.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setMessages(conv.messages as any)
    setErrorMsg(null)
  }

  function handleDeleteConv(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setConversations((prev) => prev.filter((c) => c.id !== id))
    deleteConversation(id).catch(() => {})
    if (id === convId) startNewConversation()
  }

  function handleSubmit(msg: PromptInputMessage) {
    if (!msg.text.trim()) return
    append({ role: "user", content: msg.text })
  }

  function copyConversation() {
    const text = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => {
        const label = m.role === "user" ? "You" : "Modus"
        const content = m.parts?.find((p: { type: string }) => p.type === "text") as { type: string; text: string } | undefined
        return `${label}: ${content?.text ?? "[tool result]"}`
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
        const content = m.parts?.find((p: { type: string }) => p.type === "text") as { type: string; text: string } | undefined
        return `${label}\n\n${content?.text ?? "*[tool result]*"}`
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
        const content = m.parts?.find((p: { type: string }) => p.type === "text") as { type: string; text: string } | undefined
        return `${label}: ${content?.text ?? "[tool result]"}`
      })
      .join("\n\n")
    if (navigator.share) {
      navigator.share({ title: "Modus Chat", text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text)
    }
    setMenuOpen(false)
  }

  return (
    <div className="flex h-full">
      {/* ── History Sub-Sidebar ── */}
      {historyOpen && (
        <aside className="flex w-60 shrink-0 flex-col border-r border-gray-100 bg-gray-50/50">
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
                    icon={Robot02Icon}
                    size={13}
                    color={conv.id === convId ? "#16a34a" : "#d1d5db"}
                    strokeWidth={1.5}
                  />
                  <span className="flex-1 truncate text-xs leading-relaxed">{conv.title}</span>
                  <button
                    onClick={(e) => handleDeleteConv(conv.id, e)}
                    title="Delete"
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
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3.5 shrink-0">
          <button
            onClick={() => setHistoryOpen((o) => !o)}
            title={historyOpen ? "Hide history" : "Show history"}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <HugeiconsIcon icon={Robot02Icon} size={18} color="currentColor" strokeWidth={1.5} />
          </button>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600">
            <HugeiconsIcon icon={Robot02Icon} size={18} color="white" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Modus Agent</h1>
            <p className="text-xs text-gray-500">Autonomous procurement AI · Arc L1 · Claude</p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1">
              <span className={cn("h-1.5 w-1.5 rounded-full", isLoading ? "animate-pulse bg-amber-500" : "animate-pulse bg-green-500")} />
              <span className={cn("text-xs font-medium", isLoading ? "text-amber-700" : "text-green-700")}>
                {isLoading ? "Thinking…" : "Online"}
              </span>
            </div>

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
                    onClick={() => { startNewConversation(); setMenuOpen(false) }}
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

        {/* Error banner */}
        {(errorMsg || error) && (
          <div className="shrink-0 flex items-start gap-2 border-b border-red-100 bg-red-50 px-5 py-3">
            <HugeiconsIcon icon={Alert01Icon} size={15} color="#ef4444" strokeWidth={1.5} className="mt-0.5 shrink-0" />
            <p className="text-xs text-red-700">{errorMsg ?? error?.message}</p>
          </div>
        )}

        {/* Conversation */}
        <MessageScrollerProvider>
          <MessageScroller className="flex-1">
            <MessageScrollerViewport className="p-4">
              <MessageScrollerContent>
                {messages.length === 0 && !isLoading ? (
                  <ConversationEmptyState
                    icon={<HugeiconsIcon icon={BubbleChatSparkIcon} size={28} color="currentColor" strokeWidth={1.5} />}
                    title="Modus Agent is ready"
                    description="Ask me about inventory, orders, or wallet status — or instruct me to take action."
                  />
                ) : (
                  messages.filter((msg) => msg.role !== "data").map((msg) => {
                    const parts = msg.parts ?? []
                    const toolParts = parts.filter((p: { type: string }) => p.type === "tool-invocation")
                    const steps = toolPartsToSteps(
                      toolParts as Array<{ type: string; toolInvocation?: { toolName: string; state: string } }>
                    )

                    return (
                      <MessageScrollerItem
                        key={msg.id}
                        messageId={msg.id}
                        scrollAnchor={msg.role === "user"}
                      >
                        <Fragment>
                          {steps.length > 0 && msg.role === "assistant" && (
                            <ChainOfThought
                              steps={steps}
                              defaultOpen={steps.some((s) => s.status !== "complete")}
                            />
                          )}
                          {parts.map((part: { type: string; text?: string }, i: number) => {
                            if (part.type === "text" && part.text?.trim()) {
                              return (
                                <Message key={`${msg.id}-${i}`} from={msg.role as "user" | "assistant" | "system"}>
                                  <MessageContent>
                                    <MessageResponse>{part.text}</MessageResponse>
                                  </MessageContent>
                                </Message>
                              )
                            }
                            return null
                          })}
                        </Fragment>
                      </MessageScrollerItem>
                    )
                  })
                )}

                {isLoading && (
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-600">
                      <HugeiconsIcon icon={Robot02Icon} size={14} color="white" strokeWidth={1.5} />
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
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>

        {/* Suggestions */}
        {messages.length === 0 && !isLoading && (
          <div className="shrink-0 flex flex-wrap gap-2 px-8 pb-3">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => append({ role: "user", content: s })}
                className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 border-t border-gray-100 px-6 py-4">
          <PromptInput
            onSubmit={handleSubmit}
            className="rounded-2xl border border-gray-200 bg-gray-50 focus-within:border-green-400 focus-within:bg-white transition-colors"
          >
            <PromptInputTextarea
              placeholder="Ask the agent anything…"
              className="min-h-10 max-h-40 bg-transparent px-4 pt-3"
            />
            <PromptInputFooter className="px-3 pb-2">
              <PromptInputTools />
              <PromptInputSubmit status={status} onStop={stop} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  )
}

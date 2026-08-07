const STORAGE_KEY = "modus_conversations"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StoredMessage = Record<string, any>

export interface Conversation {
  id: string
  title: string
  messages: StoredMessage[]
  createdAt: string
  updatedAt: string
}

export function getConversations(): Conversation[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
  } catch {
    return []
  }
}

export function getConversation(id: string): Conversation | undefined {
  return getConversations().find((c) => c.id === id)
}

export function saveConversation(conv: Conversation): void {
  const others = getConversations().filter((c) => c.id !== conv.id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([conv, ...others]))
}

export function deleteConversation(id: string): void {
  const others = getConversations().filter((c) => c.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(others))
}

export function makeTitle(messages: StoredMessage[]): string {
  const first = messages.find((m) => m.role === "user")
  if (!first) return "New conversation"
  const content = first.content
  let text: string
  if (typeof content === "string") {
    text = content
  } else if (Array.isArray(content)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    text = content.find((p: any) => p.type === "text")?.text ?? "Conversation"
  } else {
    text = "Conversation"
  }
  return text.length > 46 ? text.slice(0, 46) + "…" : text
}

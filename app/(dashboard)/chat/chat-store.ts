// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StoredMessage = Record<string, any>

export interface Conversation {
  id: string
  title: string
  messages: StoredMessage[]
  createdAt: string
  updatedAt: string
}

export async function getConversations(): Promise<Conversation[]> {
  try {
    const res = await fetch("/api/chat/conversations")
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  const all = await getConversations()
  return all.find((c) => c.id === id)
}

export async function saveConversation(conv: Conversation): Promise<void> {
  await fetch("/api/chat/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(conv),
  })
}

export async function deleteConversation(id: string): Promise<void> {
  await fetch(`/api/chat/conversations/${id}`, { method: "DELETE" })
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

import { NextResponse } from "next/server"
import { getChatConversations, saveChatConversation } from "@/lib/store"
import { getUserIdFromRequest } from "@/lib/auth-server"

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(await getChatConversations(userId))
}

export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await req.json()
  if (!body.id || !body.title || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }
  await saveChatConversation(userId, body)
  return NextResponse.json({ ok: true })
}

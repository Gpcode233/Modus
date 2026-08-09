import { NextResponse } from "next/server"
import { deleteChatConversation } from "@/lib/store"
import { getUserIdFromRequest } from "@/lib/auth-server"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserIdFromRequest(req)
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await deleteChatConversation(userId, id)
  return NextResponse.json({ ok: true })
}

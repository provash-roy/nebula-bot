import { notFound } from "next/navigation"

import { ChatHeader } from "@/components/chat-header"
import { getUserChatById } from "@/queries/chats"

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>
}) {
  const { chatId } = await params
  const chat = await getUserChatById(chatId)

  if (!chat) {
    notFound()
  }

  return (
    <>
      <ChatHeader name={chat.name} avatar={chat.avatar} />
      <p>{chatId}</p>
    </>
  )
}

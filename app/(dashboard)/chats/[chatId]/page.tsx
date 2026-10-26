import { notFound } from "next/navigation"

import { ChatHeader } from "@/components/chat-header"
import { ChatInterface } from "@/components/chat-interface"
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
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatHeader name={chat.name} avatar={chat.avatar} bot={chat.bot} />
      <ChatInterface
        chatId={chat.id}
        agentContext={{
          name: chat.bot?.name ?? chat.name,
          job: chat.bot?.job ?? "Conversational assistant",
          instructions:
            chat.bot?.instructions ??
            "Help the user with their questions and requests.",
          sandboxId: chat.bot?.sandboxId ?? null,
        }}
      />
    </div>
  )
}

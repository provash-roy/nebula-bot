import { notFound } from "next/navigation"

import {
  ChatDesktopPanel,
  ChatDesktopPanelProvider,
} from "@/components/chat-desktop-panel"
import { ChatHeader } from "@/components/chat-header"
import { ChatInterface } from "@/components/chat-interface"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
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
    <ChatDesktopPanelProvider>
      {chat.kind === "group" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <ChatHeader
            name={chat.name}
            avatar={chat.avatar}
            bot={chat.bot}
            kind={chat.kind}
            bots={chat.bots}
          />
          <ChatInterface
            chatId={chat.id}
            kind={chat.kind}
            bots={chat.bots}
          />
        </div>
      ) : (
        <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
          <ResizablePanel id="chat-content" minSize="30%">
            <div className="flex h-full min-h-0 flex-col">
              <ChatHeader
                name={chat.name}
                avatar={chat.avatar}
                bot={chat.bot}
                kind={chat.kind}
                bots={chat.bots}
              />
              <ChatInterface
                chatId={chat.id}
                kind={chat.kind}
                bots={chat.bots}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ChatDesktopPanel
            chatId={chat.id}
            screenName={chat.bot?.name ?? chat.name}
          />
        </ResizablePanelGroup>
      )}
    </ChatDesktopPanelProvider>
  )
}

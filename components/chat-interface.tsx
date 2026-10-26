"use client"

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input"
import {
  loadChatTranscript,
  mintChatAccessToken,
  startChatSession,
} from "@/actions/chat"
import { useChat } from "@ai-sdk/react"
import type { UIMessage } from "ai"
import { MessageSquare } from "lucide-react"
import { useState } from "react"
import {
  useLoadTranscript,
  useTriggerChatTransport,
} from "@trigger.dev/sdk/chat/react"

import type { chatAgent, chatAgentClientDataSchema } from "@/app/trigger/chat"
import type { z } from "zod"

type ChatAgentClientData = z.infer<typeof chatAgentClientDataSchema>

export function ChatInterface({
  chatId,
  agentContext,
}: {
  chatId: string
  agentContext: ChatAgentClientData
}) {
  const transport = useTriggerChatTransport<typeof chatAgent>({
    task: "nebula-chat",
    clientData: agentContext,
    accessToken: ({ chatId }) => mintChatAccessToken(chatId),
    startSession: ({ chatId, clientData }) =>
      startChatSession({ chatId, clientData }),
  })
  const {
    messages: initialMessages,
    isLoading,
    error: transcriptError,
  } = useLoadTranscript(chatId, loadChatTranscript, { transport })

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading conversation...
      </div>
    )
  }

  if (transcriptError) {
    return (
      <p role="alert" className="p-4 text-sm text-destructive">
        Failed to load conversation: {transcriptError.message}
      </p>
    )
  }

  return (
    <ChatConversation
      key={chatId}
      chatId={chatId}
      initialMessages={initialMessages}
      transport={transport}
    />
  )
}

function ChatConversation({
  chatId,
  initialMessages,
  transport,
}: {
  chatId: string
  initialMessages: UIMessage[]
  transport: ReturnType<typeof useTriggerChatTransport<typeof chatAgent>>
}) {
  const [input, setInput] = useState("")
  const { messages, sendMessage, status, stop, error } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
  })

  const handleSubmit = ({ text }: PromptInputMessage) => {
    if (!text.trim()) {
      return
    }

    void sendMessage({ text })
    setInput("")
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col p-4">
      <Conversation>
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<MessageSquare className="size-10" />}
              title="Start a conversation"
              description="Send a message to start chatting."
            />
          ) : (
            messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, index) =>
                    part.type === "text" ? (
                      <MessageResponse key={`${message.id}-${index}`}>
                        {part.text}
                      </MessageResponse>
                    ) : null
                  )}
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput onSubmit={handleSubmit} className="mt-4">
        <PromptInputTextarea
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          placeholder="Message..."
        />
        <PromptInputSubmit
          status={status}
          onStop={stop}
          disabled={
            !input.trim() && status !== "submitted" && status !== "streaming"
          }
        />
      </PromptInput>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  )
}

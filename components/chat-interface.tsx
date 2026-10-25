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
import { useChat } from "@ai-sdk/react"
import { MessageSquare } from "lucide-react"
import { useState } from "react"

export function ChatInterface() {
  const [input, setInput] = useState("")
  const { messages, sendMessage, status, stop, error } = useChat()

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

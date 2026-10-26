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
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolPart,
} from "@/components/ai-elements/tool"
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
import Image from "next/image"
import { useState } from "react"
import {
  useLoadTranscript,
  useTriggerChatTransport,
} from "@trigger.dev/sdk/chat/react"

import type { chatAgent } from "@/app/trigger/chat"

export function ChatInterface({ chatId }: { chatId: string }) {
  const transport = useTriggerChatTransport<typeof chatAgent>({
    task: "nebula-chat",
    accessToken: ({ chatId }) => mintChatAccessToken(chatId),
    startSession: ({ chatId }) => startChatSession({ chatId }),
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
                  {message.parts.map((part, index) => {
                    if (part.type === "text") {
                      return (
                        <MessageResponse key={`${message.id}-${index}`}>
                          {part.text}
                        </MessageResponse>
                      )
                    }

                    if (isToolPart(part)) {
                      return (
                        <ChatTool key={`${message.id}-${index}`} part={part} />
                      )
                    }

                    return null
                  })}
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

function isToolPart(part: UIMessage["parts"][number]): part is ToolPart {
  return part.type === "dynamic-tool" || part.type.startsWith("tool-")
}

function isScreenshotOutput(
  output: unknown
): output is { screenshot: string; mimeType: string } {
  return (
    typeof output === "object" &&
    output !== null &&
    "screenshot" in output &&
    typeof output.screenshot === "string" &&
    "mimeType" in output &&
    typeof output.mimeType === "string"
  )
}

function ChatTool({ part }: { part: ToolPart }) {
  const toolName =
    part.type === "dynamic-tool" ? part.toolName : part.type.slice(5)
  const output = part.state === "output-available" ? part.output : undefined
  const screenshot =
    toolName === "show_screen" && isScreenshotOutput(output) ? output : null
  const visibleOutput =
    toolName === "view_screen" && output ? (
      "Screen inspected privately; the screenshot is not shown in chat."
    ) : screenshot ? (
      <Image
        src={`data:${screenshot.mimeType};base64,${screenshot.screenshot}`}
        alt="Screenshot of the bot's Daytona sandbox"
        width={800}
        height={600}
        unoptimized
        className="max-h-[480px] w-full object-contain"
      />
    ) : (
      output
    )
  const errorText = part.state === "output-error" ? part.errorText : undefined

  return (
    <Tool defaultOpen={part.state === "input-available"}>
      {part.type === "dynamic-tool" ? (
        <ToolHeader
          type="dynamic-tool"
          toolName={toolName}
          state={part.state}
        />
      ) : (
        <ToolHeader type={part.type} state={part.state} />
      )}
      <ToolContent>
        <ToolInput input={part.input ?? {}} />
        <ToolOutput output={visibleOutput} errorText={errorText} />
      </ToolContent>
    </Tool>
  )
}

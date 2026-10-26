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
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
  PromptInputActionMenuTrigger,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input"
import { DropdownMenuGroup } from "@/components/ui/dropdown-menu"
import {
  loadChatTranscript,
  mintChatAccessToken,
  startChatSession,
} from "@/actions/chat"
import { useChat } from "@ai-sdk/react"
import type { UIMessage } from "ai"
import { CheckIcon, ChevronDownIcon, MessageSquare } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import {
  useLoadTranscript,
  useTriggerChatTransport,
} from "@trigger.dev/sdk/chat/react"

import type { chatAgent } from "@/app/trigger/chat"
import { ChatAvatar } from "@/components/chat-avatar"

type ChatBot = { id: string; name: string; avatar: string }

export function ChatInterface({
  chatId,
  kind,
  bots,
}: {
  chatId: string
  kind: "direct" | "group"
  bots: ChatBot[]
}) {
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
      kind={kind}
      bots={bots}
      initialMessages={initialMessages}
      transport={transport}
    />
  )
}

function ChatConversation({
  chatId,
  kind,
  bots,
  initialMessages,
  transport,
}: {
  chatId: string
  kind: "direct" | "group"
  bots: ChatBot[]
  initialMessages: UIMessage[]
  transport: ReturnType<typeof useTriggerChatTransport<typeof chatAgent>>
}) {
  const [input, setInput] = useState("")
  const [selectedBotId, setSelectedBotId] = useState(bots[0]?.id ?? "")
  const selectedBot = bots.find((bot) => bot.id === selectedBotId)
  const { messages, sendMessage, status, stop, error } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
  })

  const handleSubmit = ({ text }: PromptInputMessage) => {
    if (!text.trim()) {
      return
    }

    void sendMessage(
      { text },
      kind === "group" ? { metadata: { botId: selectedBotId } } : undefined
    )
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
            messages.map((message) => {
              const responder = bots.find(
                (bot) => bot.id === getMessageBotId(message)
              )

              return (
                <div
                  key={message.id}
                  className={
                    kind === "group" && message.role === "assistant"
                      ? "flex items-end gap-2"
                      : undefined
                  }
                >
                  {kind === "group" &&
                    message.role === "assistant" &&
                    responder && (
                      <ChatAvatar
                        seed={responder.avatar}
                        className="size-6 shrink-0"
                      />
                    )}
                  <Message from={message.role}>
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
                            <ChatTool
                              key={`${message.id}-${index}`}
                              part={part}
                            />
                          )
                        }

                        return null
                      })}
                    </MessageContent>
                  </Message>
                </div>
              )
            })
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
        {kind === "group" && (
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger
              aria-label={`Choose bot. Current bot: ${selectedBot?.name ?? "Unknown"}`}
              className="max-w-40"
            >
              <ChatAvatar
                seed={selectedBot?.avatar ?? ""}
                className="size-5 shrink-0"
              />
              <span className="truncate">
                {selectedBot?.name ?? "Choose bot"}
              </span>
              <ChevronDownIcon data-icon="inline-end" />
            </PromptInputActionMenuTrigger>
            <PromptInputActionMenuContent>
              <DropdownMenuGroup>
                {bots.map((bot) => (
                  <PromptInputActionMenuItem
                    key={bot.id}
                    onClick={() => setSelectedBotId(bot.id)}
                  >
                    <ChatAvatar
                      seed={bot.avatar}
                      className="size-5 shrink-0"
                    />
                    <span>{bot.name}</span>
                    {bot.id === selectedBotId && (
                      <CheckIcon className="ml-auto" />
                    )}
                  </PromptInputActionMenuItem>
                ))}
              </DropdownMenuGroup>
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
        )}
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

function getMessageBotId(message: UIMessage) {
  const metadata: unknown = message.metadata

  if (
    typeof metadata === "object" &&
    metadata !== null &&
    "botId" in metadata &&
    typeof metadata.botId === "string"
  ) {
    return metadata.botId
  }
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

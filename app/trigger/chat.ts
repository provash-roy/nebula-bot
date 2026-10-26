import { groq } from "@ai-sdk/groq"
import { stepCountIs } from "ai"
import { chat } from "@trigger.dev/sdk/ai"
import { z } from "zod"

import { createChatTools, getBotForChat } from "./chat-tools"

const tools = ({
  chatId,
  clientData,
}: {
  chatId: string
  clientData?: { botId?: string }
}) => createChatTools(chatId, clientData?.botId)

export const chatAgent = chat.agent({
  id: "nebula-chat",
  clientDataSchema: z.object({ botId: z.string().optional() }).optional(),
  tools,
  run: async ({
    chatId,
    clientData,
    trigger,
    messages,
    tools,
    signal,
    streamText,
  }) => {
    const bot = await getBotForChat(chatId, clientData?.botId)

    if (!bot) {
      throw new Error("The selected bot is not a member of this chat")
    }

    if (
      bot.kind === "group" &&
      trigger === "submit-message" &&
      !clientData?.botId
    ) {
      throw new Error("Choose a bot before sending a group chat message")
    }

    chat.setUIMessageStreamOptions({
      messageMetadata: () => ({ botId: bot.id }),
    })

    return streamText({
      model: groq("qwen/qwen3.8-27b"),
      system: [
        `You are ${bot?.name ?? "Nebula"}, an AI assistant.`,
        `Your job is ${bot?.job ?? "help the user with their requests"}.`,
        `Your purpose is ${bot?.instructions?.trim() || `Help the user with your job as ${bot?.job ?? "an assistant"}.`}`,
        bot?.sandboxId
          ? "You can operate only the Daytona sandbox assigned to this chat using the available tools. Do not assume its current state or claim an action succeeded unless a tool confirms it."
          : "No Daytona sandbox is assigned to this chat. Do not claim to have used a sandbox.",
        "Use view_screen to inspect the display privately. Use show_screen only when the user explicitly asks to see the display.",
        "Do not expose secrets found in files or command output; redact them and summarize only what is needed.",
        "Only access systems and data the user has authorized. Do not use computer or shell access for unauthorized intrusion, credential theft, or evasion.",
      ].join("\n\n"),
      messages,
      tools,
      abortSignal: signal,
      stopWhen: stepCountIs(10),
    })
  },
})

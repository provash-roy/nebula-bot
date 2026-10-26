import { groq } from "@ai-sdk/groq"
import { stepCountIs } from "ai"
import { chat } from "@trigger.dev/sdk/ai"
import { z } from "zod"

import {
  createChatTools,
  getBotForChat,
  getGroupBotsForChat,
} from "./chat-tools"

const tools = ({
  chatId,
  clientData,
}: {
  chatId: string
  clientData?: { botId?: string }
}) =>
  getBotForChat(chatId, clientData?.botId).then((bot) =>
    createChatTools(chatId, clientData?.botId, bot?.kind === "group")
  )

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

    let activeBot = bot
    const botInstructions = (currentBot: typeof bot) => [
      `You are ${currentBot.name}, an AI assistant.`,
      `Your job is ${currentBot.job}.`,
      `Your purpose is ${currentBot.instructions?.trim() || `Help the user with your job as ${currentBot.job}.`}`,
      currentBot.kind === "group"
        ? [
            "You are one of several bots in a group chat. The user chooses which bot starts each turn, but you may hand off the response when a different group member is clearly better suited.",
            "Use the handoff tool at most once per user turn, selecting a bot from the roster by its exact bot ID. After a handoff, answer the user's original request directly as the receiving bot; do not narrate the handoff or repeat work already completed.",
            `Group roster:\n${groupRoster.map((member) => `- ${member.name} (bot ID: ${member.id}): ${member.job}`).join("\n")}`,
            "Available tools: bash runs a command; read_file, write_file, and list_files access files; mouse_click, mouse_move, mouse_scroll, keyboard_type, and keyboard_press control your sandbox desktop; view_screen inspects it privately; show_screen displays it to the user. These tools operate only on the active bot's dedicated Daytona sandbox. A handoff changes which bot's sandbox those tools use.",
          ].join("\n")
        : "",
      currentBot.sandboxId
        ? "You can operate only the Daytona sandbox assigned to you using the available tools. Do not assume its current state or claim an action succeeded unless a tool confirms it."
        : "No Daytona sandbox is assigned to you. Do not claim to have used a sandbox.",
      "Use view_screen to inspect the display privately. Use show_screen only when the user explicitly asks to see the display.",
      "Do not expose secrets found in files or command output; redact them and summarize only what is needed.",
      "Only access systems and data the user has authorized. Do not use computer or shell access for unauthorized intrusion, credential theft, or evasion.",
    ]
    const groupRoster =
      bot.kind === "group"
        ? await getGroupBotsForChat(chatId)
        : []

    chat.setUIMessageStreamOptions({
      messageMetadata: () => ({ botId: activeBot.id }),
    })

    return streamText({
      model: groq("qwen/qwen3.8-27b"),
      system: botInstructions(activeBot).filter(Boolean).join("\n\n"),
      messages,
      tools,
      abortSignal: signal,
      stopWhen: stepCountIs(10),
      prepareStep: async ({ steps }) => {
        const handoff = [...steps]
          .flatMap((step) => step.staticToolResults)
          .reverse()
          .find(
            (result) =>
              result.toolName === "handoff" &&
              isHandoffResult(result.output)
          )

        if (!handoff || !isHandoffResult(handoff.output)) {
          return
        }

        const nextBot = await getBotForChat(chatId, handoff.output.botId)

        if (!nextBot || nextBot.kind !== "group") {
          throw new Error("The handoff bot is no longer a member of this group")
        }

        activeBot = nextBot

        return {
          system: botInstructions(activeBot).filter(Boolean).join("\n\n"),
        }
      },
    })
  },
})

function isHandoffResult(
  output: unknown
): output is { botId: string; botName: string; reason: string } {
  return (
    typeof output === "object" &&
    output !== null &&
    "botId" in output &&
    typeof output.botId === "string" &&
    "botName" in output &&
    typeof output.botName === "string" &&
    "reason" in output &&
    typeof output.reason === "string"
  )
}

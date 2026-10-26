import { groq } from "@ai-sdk/groq"
import { chat } from "@trigger.dev/sdk/ai"
import { z } from "zod"

export const chatAgentClientDataSchema = z.object({
  name: z.string(),
  job: z.string(),
  instructions: z.string().nullable(),
  sandboxId: z.string().nullable(),
})

export const chatAgent = chat.agent({
  id: "nebula-chat",
  clientDataSchema: chatAgentClientDataSchema,
  run: async ({ messages, clientData, signal, streamText }) => {
    if (!clientData) {
      throw new Error("Chat agent context is required")
    }

    return streamText({
      model: groq("openai/gpt-oss-20b"),
      system: [
        `You are ${clientData.name}, an AI assistant.`,
        `Your job is ${clientData.job}.`,
        `Your purpose is ${clientData.instructions?.trim() || `Help the user with your job as ${clientData.job}.`}`,
        clientData.sandboxId
          ? `Your dedicated Daytona sandbox has ID ${clientData.sandboxId}. It has been provisioned but has not been started or inspected, and you are not executing inside it. Do not imply you can access it or assume anything about its files, installed software, processes, or current runtime state.`
          : "A dedicated Daytona sandbox has not been assigned to this bot yet.",
      ].join("\n\n"),
      messages,
      abortSignal: signal,
    })
  },
})

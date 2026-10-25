import { groq } from "@ai-sdk/groq"
import { chat } from "@trigger.dev/sdk/ai"

export const chatAgent = chat.agent({
  id: "nebula-chat",
  run: async ({ messages, signal, streamText }) =>
    streamText({
      model: groq("openai/gpt-oss-20b"),
      messages,
      abortSignal: signal,
    }),
})

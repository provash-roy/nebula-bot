import { auth } from "@clerk/nextjs/server"
import { convertToModelMessages, streamText, type UIMessage } from "ai"
import { groq } from "@ai-sdk/groq"

export const maxDuration = 30

export async function POST(request: Request) {
  const { isAuthenticated } = await auth()

  if (!isAuthenticated) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { messages }: { messages: UIMessage[] } = await request.json()
  const result = streamText({
    model: groq("openai/gpt-oss-20b"),
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}

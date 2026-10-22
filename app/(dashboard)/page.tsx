import { auth } from "@clerk/nextjs/server"
import { randomUUID } from "node:crypto"

import { BotDialog } from "@/components/bot-dialog"
import { ChatAvatar } from "@/components/chat-avatar"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default async function Page() {
  await auth.protect()
  const avatarSeed = randomUUID()

  return (
    <Empty className="min-h-svh gap-5 border-0 p-6">
      <EmptyHeader className="max-w-xl">
        <EmptyMedia className="mb-2">
          <ChatAvatar seed={avatarSeed} className="size-12" />
        </EmptyMedia>
        <EmptyTitle className="text-lg">Meet your first bot</EmptyTitle>
        <EmptyDescription className="text-lg">
          Every bot gets its own personality, memory, and face. Spin one up and
          start the conversation.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <BotDialog />
      </EmptyContent>
    </Empty>
  )
}

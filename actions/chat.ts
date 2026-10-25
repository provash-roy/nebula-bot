"use server"

import { auth as clerkAuth } from "@clerk/nextjs/server"
import { auth as triggerAuth } from "@trigger.dev/sdk"
import { chat, defaultStorage } from "@trigger.dev/sdk/ai"

import type { chatAgent } from "@/app/trigger/chat"
import { prisma } from "@/lib/prisma"

const startSession =
  chat.createStartSessionAction<typeof chatAgent>("nebula-chat")
const readTranscript = chat.createLoadTranscriptAction(defaultStorage)

async function assertChatOwner(chatId: string) {
  const { isAuthenticated, userId } = await clerkAuth()

  if (!isAuthenticated || !userId) {
    throw new Error("Unauthorized")
  }

  const ownedChat = await prisma.chat.findFirst({
    where: { id: chatId, userId },
    select: { id: true },
  })

  if (!ownedChat) {
    throw new Error("Chat not found or access denied")
  }
}

export async function startChatSession({ chatId }: { chatId: string }) {
  await assertChatOwner(chatId)
  return startSession({ chatId })
}

export async function mintChatAccessToken(chatId: string) {
  await assertChatOwner(chatId)

  return triggerAuth.createPublicToken({
    scopes: {
      read: { sessions: chatId },
      write: { sessions: chatId },
    },
    expirationTime: "1h",
  })
}

export async function loadChatTranscript({ chatId }: { chatId: string }) {
  await assertChatOwner(chatId)
  return readTranscript({ chatId })
}

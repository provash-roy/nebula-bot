"use server"

import { auth as clerkAuth } from "@clerk/nextjs/server"
import { auth as triggerAuth } from "@trigger.dev/sdk"
import { SandboxState } from "@daytona/sdk"
import { chat, defaultStorage } from "@trigger.dev/sdk/ai"
import { revalidatePath } from "next/cache"

import type { chatAgent } from "@/app/trigger/chat"
import {
  groupChatInsertSchema,
  type GroupChatInsert,
} from "@/db/schema"
import { getDaytona } from "@/lib/daytona"
import { prisma } from "@/lib/prisma"

const startSession =
  chat.createStartSessionAction<typeof chatAgent>("nebula-chat")
const readTranscript = chat.createLoadTranscriptAction(defaultStorage)

export async function createGroupChat(values: GroupChatInsert) {
  const { isAuthenticated, userId } = await clerkAuth()

  if (!isAuthenticated || !userId) {
    throw new Error("Unauthorized")
  }

  const data = groupChatInsertSchema.parse(values)
  const botCount = await prisma.bot.count({
    where: { id: { in: data.botIds }, userId },
  })

  if (botCount !== data.botIds.length) {
    throw new Error("One or more selected bots could not be found")
  }

  const createdChat = await prisma.chat.create({
    data: {
      userId,
      kind: "group",
      name: data.name,
      members: {
        create: data.botIds.map((botId) => ({
          bot: { connect: { id: botId } },
        })),
      },
    },
    select: { id: true },
  })

  revalidatePath("/")
  return createdChat
}

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

export async function getChatDesktopPreview(chatId: string) {
  const { isAuthenticated, userId } = await clerkAuth()

  if (!isAuthenticated || !userId) {
    throw new Error("Unauthorized")
  }

  const chat = await prisma.chat.findFirst({
    where: {
      id: chatId,
      userId,
      members: { some: { bot: { userId } } },
    },
    select: {
      members: {
        where: { bot: { userId } },
        take: 1,
        select: { bot: { select: { sandboxId: true } } },
      },
    },
  })

  const sandboxId = chat?.members[0]?.bot.sandboxId

  if (!sandboxId) {
    throw new Error("No Daytona sandbox is assigned to this chat")
  }

  const sandbox = await getDaytona().get(sandboxId)

  if (
    sandbox.state === SandboxState.STOPPED ||
    sandbox.state === SandboxState.PAUSED
  ) {
    await sandbox.start()
  } else if (sandbox.state !== SandboxState.STARTED) {
    throw new Error(
      `The Daytona sandbox is not ready (state: ${sandbox.state ?? "unknown"})`
    )
  }

  const { status } = await sandbox.computerUse.getStatus()

  if (status?.toLowerCase() !== "running") {
    await sandbox.computerUse.start()
  }

  const preview = await sandbox.getSignedPreviewUrl(6080, 3600)
  return preview.url
}

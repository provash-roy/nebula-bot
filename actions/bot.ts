"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { botInsertSchema, type BotInsert } from "@/db/schema"

export async function updateBot(
  botId: string,
  chatId: string,
  values: BotInsert
) {
  const { isAuthenticated, userId } = await auth()
  if (!isAuthenticated || !userId) {
    throw new Error("Unauthorized")
  }

  const data = botInsertSchema.parse(values)
  const result = await prisma.bot.updateMany({
    where: {
      id: botId,
      userId,
      members: { some: { chatId } },
    },
    data,
  })

  if (result.count === 0) {
    throw new Error("Bot not found or you do not have permission to update it")
  }

  revalidatePath("/")
  revalidatePath(`/chats/${chatId}`)
}

export async function deleteBot(botId: string, chatId: string) {
  const { isAuthenticated, userId } = await auth()
  if (!isAuthenticated || !userId) {
    throw new Error("Unauthorized")
  }

  const bot = await prisma.bot.findFirst({
    where: {
      id: botId,
      userId,
      members: { some: { chatId } },
    },
    select: { id: true },
  })

  if (!bot) {
    throw new Error("Bot not found or you do not have permission to delete it")
  }

  await prisma.$transaction([
    prisma.chat.delete({
      where: { id: chatId, userId },
    }),
    prisma.bot.delete({
      where: { id: botId, userId },
    }),
  ])

  revalidatePath("/")
  revalidatePath(`/chats/${chatId}`)
}

export async function createBot(values: BotInsert) {
  const { isAuthenticated, userId } = await auth()
  if (!isAuthenticated || !userId) {
    throw new Error("Unauthorized")
  }

  const data = botInsertSchema.parse(values)
  const bot = await prisma.bot.create({
    data: {
      ...data,
      userId,
      members: {
        create: {
          chat: {
            create: {
              userId,
              kind: "direct",
            },
          },
        },
      },
    },
    include: {
      members: {
        include: {
          chat: true,
        },
      },
    },
  })

  revalidatePath("/")
  return bot
}

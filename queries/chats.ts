import "server-only"

import { auth } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"

export async function getUserChatById(chatId: string) {
  await auth.protect()
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Authenticated user ID is unavailable")
  }

  const chat = await prisma.chat.findFirst({
    where: { id: chatId, userId },
    select: {
      id: true,
      name: true,
      members: {
        orderBy: { joinedAt: "asc" },
        take: 1,
        select: {
          bot: {
            select: {
              id: true,
              name: true,
              avatar: true,
              job: true,
              instructions: true,
            },
          },
        },
      },
    },
  })

  if (!chat) {
    return null
  }

  const bot = chat.members[0]?.bot

  return {
    id: chat.id,
    name: chat.name ?? bot?.name ?? "New chat",
    avatar: bot?.avatar ?? chat.id,
    bot: bot
      ? {
          ...bot,
          chatId: chat.id,
        }
      : null,
  }
}

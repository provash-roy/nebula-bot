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
      kind: true,
      members: {
        where: { bot: { userId } },
        orderBy: { joinedAt: "asc" },
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

  const bots = chat.members.map((member) => member.bot)
  const bot = bots[0]

  return {
    id: chat.id,
    name: chat.name ?? bot?.name ?? "New chat",
    avatar: bot?.avatar ?? chat.id,
    kind: chat.kind,
    bots: bots.map(({ id, name, avatar }) => ({ id, name, avatar })),
    bot: bot
      ? {
          ...bot,
          chatId: chat.id,
        }
      : null,
  }
}

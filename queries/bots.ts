import "server-only"

import { auth } from "@clerk/nextjs/server"
import { formatDistanceToNowStrict } from "date-fns"

import { prisma } from "@/lib/prisma"

export type UserChatSummary = {
  id: string
  name: string
  preview: string
  avatarSeed: string
  lastMessageLabel: string
}

export async function getUserChats(): Promise<UserChatSummary[]> {
  await auth.protect()
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Authenticated user ID is unavailable")
  }

  const [fallbackBot, chats] = await Promise.all([
    prisma.bot.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { name: true, avatar: true, job: true },
    }),
    prisma.chat.findMany({
      where: { userId },
      orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
      include: {
        members: {
          where: { bot: { userId } },
          orderBy: { joinedAt: "asc" },
          take: 1,
          include: {
            bot: {
              select: { name: true, avatar: true, job: true },
            },
          },
        },
      },
    }),
  ])

  return chats.map((chat) => {
    const bot = chat.members[0]?.bot ?? fallbackBot

    return {
      id: chat.id,
      name: chat.name ?? bot?.name ?? "New chat",
      preview: chat.lastMessagePreview ?? bot?.job ?? "No messages yet",
      avatarSeed: bot?.avatar ?? chat.id,
      lastMessageLabel: formatDistanceToNowStrict(chat.lastMessageAt),
    }
  })
}

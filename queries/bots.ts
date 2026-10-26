import "server-only"

import { auth } from "@clerk/nextjs/server"
import { formatDistanceToNowStrict } from "date-fns"

import { prisma } from "@/lib/prisma"

export type UserChatSummary = {
  id: string
  name: string
  preview: string
  kind: "direct" | "group"
  avatarSeeds: string[]
  lastMessageLabel: string
}

export type UserBotOption = {
  id: string
  name: string
  avatar: string
}

export async function getUserBots(): Promise<UserBotOption[]> {
  await auth.protect()
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Authenticated user ID is unavailable")
  }

  return prisma.bot.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, avatar: true },
  })
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
      kind: chat.kind,
      avatarSeeds:
        chat.kind === "group"
          ? chat.members.map((member) => member.bot.avatar)
          : [bot?.avatar ?? chat.id],
      lastMessageLabel: formatDistanceToNowStrict(chat.lastMessageAt),
    }
  })
}

"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { botInsertSchema, type BotInsert } from "@/db/schema"

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

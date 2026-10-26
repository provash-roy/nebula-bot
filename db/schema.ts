import { z } from "zod"

export const botInsertSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name for your bot.")
    .max(40, "Bot names must be 40 characters or fewer."),
  avatar: z.string().trim().min(1, "Choose an avatar for your bot."),
  job: z
    .string()
    .trim()
    .min(1, "Enter a job for your bot.")
    .max(120, "Bot jobs must be 120 characters or fewer."),
  instructions: z
    .string()
    .trim()
    .max(2000, "Instructions must be 2,000 characters or fewer.")
    .transform((instructions) => instructions || null),
})

export type BotInsert = z.infer<typeof botInsertSchema>
export type BotInsertInput = z.input<typeof botInsertSchema>

export const groupChatInsertSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name for this group chat.")
    .max(40, "Group chat names must be 40 characters or fewer."),
  botIds: z
    .array(z.string().min(1))
    .min(2, "Choose at least two bots.")
    .refine((botIds) => new Set(botIds).size === botIds.length, {
      message: "Each bot can only be selected once.",
    }),
})

export type GroupChatInsert = z.infer<typeof groupChatInsertSchema>
export type GroupChatInsertInput = z.input<typeof groupChatInsertSchema>

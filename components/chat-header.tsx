"use client"

import { MonitorIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { BotDialog, type BotDialogBot } from "@/components/bot-dialog"
import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"

export function ChatHeader({
  name,
  avatar,
  bot,
}: {
  name: string
  avatar: string
  bot: BotDialogBot | null
}) {
  const router = useRouter()

  return (
    <header className="flex h-11 items-center justify-between border-b px-4">
      <div className="flex min-w-0 items-center gap-2">
        {bot ? (
          <BotDialog
            bot={bot}
            onSaved={() => router.refresh()}
            onDeleted={() => router.replace("/")}
          />
        ) : (
          <>
            <ChatAvatar seed={avatar} className="size-5 shrink-0" />
            <span className="truncate text-sm font-medium">{name}</span>
          </>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Desktop"
        className="size-8"
      >
        <MonitorIcon data-icon="inline-start" />
      </Button>
    </header>
  )
}

"use client"

import { MonitorIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import { BotDialog, type BotDialogBot } from "@/components/bot-dialog"
import { ChatAvatar } from "@/components/chat-avatar"
import { useChatDesktopPanel } from "@/components/chat-desktop-panel"
import { GroupChatAvatar } from "@/components/group-chat-avatar"
import { Button } from "@/components/ui/button"

export function ChatHeader({
  name,
  avatar,
  bot,
  kind,
  bots,
}: {
  name: string
  avatar: string
  bot: BotDialogBot | null
  kind: "direct" | "group"
  bots: { id: string; name: string; avatar: string }[]
}) {
  const router = useRouter()
  const { isOpen, toggle } = useChatDesktopPanel()

  return (
    <header className="flex h-11 items-center justify-between border-b px-4">
      <div className="flex min-w-0 items-center gap-2">
        {kind === "group" ? (
          <>
            <GroupChatAvatar
              avatarSeeds={bots.map((member) => member.avatar)}
              className="size-5"
            />
            <span className="truncate text-sm font-medium">{name}</span>
          </>
        ) : bot ? (
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
      {kind === "direct" && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={isOpen ? "Close desktop panel" : "Open desktop panel"}
          aria-pressed={isOpen}
          onClick={toggle}
          className="size-8"
        >
          <MonitorIcon data-icon="inline-start" />
        </Button>
      )}
    </header>
  )
}

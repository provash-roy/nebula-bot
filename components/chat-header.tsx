import { MonitorIcon } from "lucide-react"

import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"

export function ChatHeader({
  name,
  avatar,
}: {
  name: string
  avatar: string
}) {
  return (
    <header className="flex h-11 items-center justify-between border-b px-4">
      <div className="flex min-w-0 items-center gap-2">
        <ChatAvatar seed={avatar} className="size-5 shrink-0" />
        <span className="truncate text-sm font-medium">{name}</span>
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

import { ChatAvatar } from "@/components/chat-avatar"
import { cn } from "@/lib/utils"

type GroupChatAvatarProps = {
  avatarSeeds: string[]
  className?: string
}

export function GroupChatAvatar({
  avatarSeeds,
  className,
}: GroupChatAvatarProps) {
  const visibleSeeds = avatarSeeds.slice(0, 3)

  if (avatarSeeds.length > 3) {
    return (
      <div
        className={cn(
          "grid aspect-square shrink-0 grid-cols-2 grid-rows-2 gap-px",
          className
        )}
      >
        {visibleSeeds.map((seed, index) => (
          <ChatAvatar
            key={`${seed}-${index}`}
            seed={seed}
            className="size-full rounded-full border border-background"
          />
        ))}
        <span className="flex size-full items-center justify-center rounded-full border border-background bg-muted text-[0.6em] font-medium text-muted-foreground">
          +{avatarSeeds.length - 3}
        </span>
      </div>
    )
  }

  if (visibleSeeds.length <= 1) {
    return (
      <ChatAvatar
        seed={visibleSeeds[0] ?? ""}
        className={cn("shrink-0", className)}
      />
    )
  }

  if (visibleSeeds.length === 2) {
    return (
      <div className={cn("relative aspect-square shrink-0", className)}>
        {visibleSeeds.map((seed, index) => (
          <ChatAvatar
            key={`${seed}-${index}`}
            seed={seed}
            className={cn(
              "absolute top-1/2 size-[68%] -translate-y-1/2 rounded-full border-2 border-background",
              index === 0 ? "left-0 z-10" : "right-0"
            )}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative grid aspect-square shrink-0 grid-cols-2 grid-rows-2",
        className
      )}
    >
      {visibleSeeds.map((seed, index) => (
        <ChatAvatar
          key={`${seed}-${index}`}
          seed={seed}
          className={cn(
            "absolute size-[58%] rounded-full border-2 border-background",
            index === 0 && "top-0 left-1/2 z-10 -translate-x-1/2",
            index === 1 && "bottom-0 left-0",
            index === 2 && "right-0 bottom-0"
          )}
        />
      ))}
    </div>
  )
}

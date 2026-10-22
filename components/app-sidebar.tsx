"use client"

import { UserButton } from "@clerk/nextjs"
import { PlusIcon, SearchIcon, UsersRoundIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { BotDialog } from "@/components/bot-dialog"
import { ChatAvatar } from "@/components/chat-avatar"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { UserChatSummary } from "@/queries/bots"

export function AppSidebar({ chats }: { chats: UserChatSummary[] }) {
  const [botDialogOpen, setBotDialogOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        typeof event.key === "string" &&
        event.key.toLowerCase() === "k" &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <Sidebar>
      <SidebarHeader>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Create"
            render={
              <SidebarMenuButton className="ml-auto size-8 justify-center p-0" />
            }
          >
            <PlusIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setBotDialogOpen(true)}>
              <PlusIcon />
              Create new bot
            </DropdownMenuItem>
            <DropdownMenuItem>
              <UsersRoundIcon />
              Create group chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          className="h-8 w-full min-w-0 justify-start gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm font-normal text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => setSearchOpen(true)}
        >
          <SearchIcon />
          <span>Search</span>
          <CommandShortcut>⌘K</CommandShortcut>
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    size="lg"
                    className="h-14 gap-3 px-2"
                    tooltip={chat.name}
                  >
                    <ChatAvatar
                      seed={chat.avatarSeed}
                      className="size-8 shrink-0"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <span className="truncate font-medium">
                          {chat.name}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {chat.lastMessageLabel}
                        </span>
                      </div>
                      <span className="truncate text-xs text-muted-foreground">
                        {chat.preview}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <CommandDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Search chats"
        description="Search your chats by bot name or message."
        className="p-0"
      >
        <Command>
          <CommandInput placeholder="Search chats..." />
          <CommandList>
            <CommandEmpty>No chats found.</CommandEmpty>
            <CommandGroup heading="Chats">
              {chats.map((chat) => (
                <CommandItem
                  key={chat.id}
                  value={`${chat.name} ${chat.preview}`}
                  onSelect={() => setSearchOpen(false)}
                >
                  <ChatAvatar
                    seed={chat.avatarSeed}
                    className="size-8 shrink-0"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <span className="truncate font-medium">{chat.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {chat.lastMessageLabel}
                      </span>
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                      {chat.preview}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-auto p-0 hover:bg-transparent active:bg-transparent"
              render={<div />}
            >
              <UserButton
                appearance={{
                  elements: {
                    userButtonBox: "w-full",
                    userButtonTrigger:
                      "h-8 w-full justify-start gap-2 rounded-md px-2 text-sm font-normal text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    userButtonAvatarBox: "size-6",
                    userButtonOuterIdentifier: "text-sidebar-foreground",
                  },
                }}
                showName
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <BotDialog
        open={botDialogOpen}
        onOpenChange={setBotDialogOpen}
        showTrigger={false}
      />
    </Sidebar>
  )
}

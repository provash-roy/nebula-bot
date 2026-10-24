"use client"

import { UserButton } from "@clerk/nextjs"
import { PlusIcon, SearchIcon, UsersRoundIcon } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import type { UserChatSummary } from "@/queries/bots"

export function AppSidebar({ chats }: { chats: UserChatSummary[] }) {
  const [botDialogOpen, setBotDialogOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const navigateToChat = (chatId: string) => {
    setSearchOpen(false)
    router.push(`/chats/${chatId}`)
  }

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
    <Sidebar collapsible="icon">
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
        <SidebarMenuButton
          className="h-8 w-full min-w-0 justify-start gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm font-normal text-muted-foreground transition-colors group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:text-sidebar-foreground hover:bg-muted hover:text-foreground group-data-[collapsible=icon]:hover:bg-sidebar-accent group-data-[collapsible=icon]:hover:text-sidebar-accent-foreground"
          onClick={() => setSearchOpen(true)}
          tooltip="Search"
        >
          <SearchIcon />
          <span className="group-data-[collapsible=icon]:hidden">Search</span>
          <CommandShortcut className="group-data-[collapsible=icon]:hidden">
            ⌘K
          </CommandShortcut>
        </SidebarMenuButton>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <SidebarMenuButton
                    size="lg"
                    className="h-14 gap-3 px-2"
                    isActive={pathname === `/chats/${chat.id}`}
                    aria-current={
                      pathname === `/chats/${chat.id}` ? "page" : undefined
                    }
                    tooltip={chat.name}
                    onClick={() => navigateToChat(chat.id)}
                  >
                    <ChatAvatar
                      seed={chat.avatarSeed}
                      className="size-8 shrink-0 group-data-[collapsible=icon]:size-4"
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
                  onSelect={() => navigateToChat(chat.id)}
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
              className="group-data-[collapsible=icon]:justify-center"
              render={<div />}
            >
              <UserButton
                appearance={{
                  elements: {
                    userButtonBox:
                      "w-full group-data-[collapsible=icon]:size-8",

                    userButtonTrigger:
                      "h-8 w-full justify-start gap-2 rounded-md px-2 text-sm font-normal text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0",

                    userButtonAvatarBox:
                      "size-6 shrink-0 group-data-[collapsible=icon]:size-4",

                    userButtonOuterIdentifier:
                      "text-sidebar-foreground group-data-[collapsible=icon]:hidden",
                  },
                }}
                showName
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
      <BotDialog
        open={botDialogOpen}
        onOpenChange={setBotDialogOpen}
        showTrigger={false}
      />
    </Sidebar>
  )
}

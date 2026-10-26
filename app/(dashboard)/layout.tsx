import { getUserBots, getUserChats } from "@/queries/bots"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [chats, bots] = await Promise.all([getUserChats(), getUserBots()])

  return (
    <SidebarProvider>
      <AppSidebar chats={chats} bots={bots} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}

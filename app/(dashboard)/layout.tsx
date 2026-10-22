import { getUserChats } from "@/queries/bots"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const chats = await getUserChats()

  return (
    <SidebarProvider>
      <AppSidebar chats={chats} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}

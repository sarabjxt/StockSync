import * as React from "react"
import {
  LayoutDashboardIcon,
  PackageIcon,
  ReceiptText,
  Settings2Icon,
  ShoppingCart,
  Users,
} from "lucide-react"

import type { Session } from "@stocksync/auth/client"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { BrandLogo } from "@/components/brand-logo"

type User = Session["user"]

const data: {
  navMain: Array<{
    title: string
    url: string
    icon?: React.ReactNode
  }>
} = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Sales",
      url: "/sales/new",
      icon: <ShoppingCart />,
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: <PackageIcon />,
    },
    {
      title: "Transactions",
      url: "/transactions",
      icon: <ReceiptText />,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: <Users />,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: <Settings2Icon />,
    },
  ],
}
export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: User
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarHeaderContent />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}

function SidebarHeaderContent() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex items-center gap-2">
        {!isCollapsed && (
          <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5!">
            <BrandLogo className="size-5!" />
            <span className="text-base font-semibold">StockSync</span>
          </SidebarMenuButton>
        )}
        <SidebarTrigger size="icon" />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

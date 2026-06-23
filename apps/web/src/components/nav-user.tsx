import { LogOutIcon, Moon, Sun } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { useState } from "react"
import type { Session } from "@stocksync/auth/client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { authClient } from "@/lib/auth"
import { Spinner } from "@/components/ui/spinner"

export function NavUser({ user }: { user: Session["user"] }) {
  const userNameFallback =
    user.name[0] + user.name.slice(user.name.indexOf(" ") + 1)[0]

  const navigate = useNavigate()

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    try {
      setIsLoggingOut(true)
      await authClient.signOut()
      navigate({
        to: "/login",
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred while logging out. Please try again."
      toast.error(message)
    } finally {
      setIsLoggingOut(false)
    }
  }
  return (
    <SidebarMenu className="bg-card border p-4 rounded-xl">
      <SidebarMenuItem className="mb-2">
        <div className="flex items-center gap-2">
          <Avatar className="size-8 grayscale">
            {/* <AvatarImage src={user.avatar} alt={user.name} /> */}
            <AvatarFallback>{userNameFallback}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs text-foreground/70">
              {user.email}
            </span>
          </div>
        </div>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <ThemeToggle
          render={
            <SidebarMenuButton>
              <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              Toggle Theme
            </SidebarMenuButton>
          }
        />
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? <Spinner /> : <LogOutIcon />}
          Logout
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

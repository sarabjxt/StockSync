import { redirect } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { getRequestHeader } from "@tanstack/react-start/server"
import { toast } from "sonner"
import { authClient } from "@/lib/auth"

export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const cookie = getRequestHeader("cookie") || ""
    return await authClient.getSession({
      fetchOptions: {
        headers: {
          cookie,
        },
      },
    })
  }
)

export const logout = async () => {
  return await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        redirect({
          to: "/login",
        })
      },
      onError: (err) => {
        toast.error(err.error.message || "An error occurred. Please try again.")
      },
    },
  })
}

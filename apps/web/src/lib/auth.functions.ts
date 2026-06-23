import { createServerFn } from "@tanstack/react-start"
import { getRequestHeader } from "@tanstack/react-start/server"
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

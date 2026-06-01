import { createFileRoute, redirect } from "@tanstack/react-router"

import { getSession } from "@/lib/auth.functions"

export const Route = createFileRoute("/")({
  beforeLoad: async ({ location }) => {
    const result = await getSession()

    if (!result.data?.user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      })
    }

    const user = result.data.user

    if (!user.name || user.name.trim() === "") {
      throw redirect({
        to: "/onboarding",
        search: { redirect: location.href },
      })
    }

    throw redirect({
      to: "/dashboard",
    })
  },
})

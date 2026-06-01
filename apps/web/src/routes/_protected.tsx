import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"

import { getSession } from "@/lib/auth.functions"

export const Route = createFileRoute("/_protected")({
  beforeLoad: async ({ location }) => {
    const result = await getSession()
    const user = result.data?.user

    if (!result.data || !user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      })
    }

    if (
      (!user.name || user.name.trim() === "") &&
      location.pathname !== "/onboarding"
    ) {
      throw redirect({
        to: "/onboarding",
        search: { redirect: location.href },
      })
    }

    return { session: result.data.session, user: user }
  },
  component: ProtectedLayout,
})

function ProtectedLayout() {
  return (
    <div className="bg-background min-h-screen w-full">
      <Outlet />
    </div>
  )
}

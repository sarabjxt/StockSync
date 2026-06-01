import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_protected/_sidebar/settings")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-heading font-medium">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your store settings.
          </p>
        </div>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  )
}

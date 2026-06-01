import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 md:gap-3 md:px-6">
        <SidebarTrigger className="-ml-2" />
        <Button
          variant="outline"
          className="text-muted-foreground w-3xs sm:w-xs justify-start hover:text-muted-foreground"
        >
          <Search />
          Search inventory...
        </Button>
      </div>
    </header>
  )
}

import { Boxes } from "lucide-react"
import type { LucideProps } from "lucide-react"

import { cn } from "@/lib/utils"

export function BrandLogo({ className, ...props }: LucideProps) {
  return (
    <Boxes className={cn("w-6 h-6", className)} strokeWidth={2} {...props} />
  )
}

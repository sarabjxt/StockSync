import { CircleAlert, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type ErrorLoadingComponentProps = {
  title: string
  description: string
  isRetrying: boolean
  onRetry: () => void
}

export function ErrorLoadingComponent({
  title,
  description,
  isRetrying,
  onRetry,
}: ErrorLoadingComponentProps) {
  return (
    <Empty className="border border-dashed md:py-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlert className="text-destructive" />
        </EmptyMedia>
        <EmptyTitle className="text-base">{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="outline"
          size="sm"
          disabled={isRetrying}
          onClick={onRetry}
        >
          <RotateCcw className={isRetrying ? "animate-spin" : ""} />
          Retry
        </Button>
      </EmptyContent>
    </Empty>
  )
}

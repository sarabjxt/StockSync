import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CircleAlert, Plus, RotateCcw } from "lucide-react"
import type { Customer } from "@/types/customer"
import { trpc } from "@/lib/trpc"
import { columns } from "@/components/customers/columns"
import { SettleDebtDialog } from "@/components/customers/settle-debt-dialog"
import { DataTable } from "@/components/ui/data-table"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import {
  CreateCustomerSheet,
  CreateCustomerSheetTrigger,
} from "@/components/customers/create-customer-sheet"
import { UpdateCustomerSheet } from "@/components/customers/update-customer-sheet"
import { CustomerHistorySheet } from "@/components/customers/customer-history-sheet"

export const Route = createFileRoute("/_protected/_sidebar/customers")({
  component: RouteComponent,
})

function RouteComponent() {
  const [settlingCustomer, setSettlingCustomer] = useState<Customer | null>(
    null
  )
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [viewHistoryCustomer, setViewHistoryCustomer] =
    useState<Customer | null>(null)

  const {
    data: customers = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery(trpc.customer.list.queryOptions())

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-heading font-medium">
            Manage Customers
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your customers and track their store credit (Udhar).
          </p>
        </div>
        <CreateCustomerSheetTrigger
          render={
            <Button size="lg">
              <Plus />
              Add Customer
            </Button>
          }
        />
      </div>
      <div>
        {isLoading ? (
          <LoadingCustomers />
        ) : isError ? (
          <ErrorLoadingCustomers
            message={error.message}
            isRetrying={isRefetching}
            onRetry={refetch}
          />
        ) : (
          <DataTable
            data={customers}
            columns={columns}
            searchColumnId="name"
            searchPlaceholder="Search customers..."
            meta={{
              onSettleDebt: setSettlingCustomer,
              onEditCustomer: setEditingCustomer,
              onViewHistory: setViewHistoryCustomer,
            }}
          />
        )}
      </div>

      <CreateCustomerSheet />
      <UpdateCustomerSheet
        customer={editingCustomer}
        open={!!editingCustomer}
        onOpenChange={(isOpen) => !isOpen && setEditingCustomer(null)}
      />
      <CustomerHistorySheet
        customer={viewHistoryCustomer}
        open={!!viewHistoryCustomer}
        onOpenChange={(isOpen) => !isOpen && setViewHistoryCustomer(null)}
      />
      <SettleDebtDialog
        customer={settlingCustomer}
        open={!!settlingCustomer}
        onOpenChange={(isOpen) => !isOpen && setSettlingCustomer(null)}
      />
    </div>
  )
}

function LoadingCustomers() {
  return (
    <Empty className="border border-dashed md:py-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Spinner />
        </EmptyMedia>
        <EmptyTitle className="text-base">Loading Customers...</EmptyTitle>
        <EmptyDescription>
          Hang on, we're fetching your customers.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function ErrorLoadingCustomers({
  message,
  isRetrying,
  onRetry,
}: {
  message: string
  isRetrying: boolean
  onRetry: () => void
}) {
  return (
    <Empty className="border border-dashed md:py-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlert className="text-destructive-foreground" />
        </EmptyMedia>
        <EmptyTitle className="text-base">Error loading customers</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="outline"
          size="sm"
          disabled={isRetrying}
          onClick={onRetry}
        >
          <RotateCcw />
          Retry
        </Button>
      </EmptyContent>
    </Empty>
  )
}

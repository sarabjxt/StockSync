import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Download } from "lucide-react"
import { format } from "date-fns"
import type { PaginationState } from "@tanstack/react-table"
import { columns } from "@/components/transactions/columns"
import { DataTable } from "@/components/ui/data-table"
import { exportToCSV } from "@/lib/export-csv"
import { Button } from "@/components/ui/button"
import { trpc } from "@/lib/trpc"
import { Spinner } from "@/components/ui/spinner"
import { ErrorLoadingComponent } from "@/components/error-loading-component"
import { LoadingComponent } from "@/components/loading-component"

export const Route = createFileRoute("/_protected/_sidebar/transactions")({
  component: RouteComponent,
})

function RouteComponent() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const { data, isLoading, isError, error, isRefetching, refetch } = useQuery(
    trpc.transaction.list.queryOptions(
      {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      },
      {
        placeholderData: keepPreviousData,
      }
    )
  )

  const transactions = data?.transactions || []
  const totalCount = data?.totalCount || 0

  const handleExport = () => {
    // Clean up the data format specifically for the spreadsheet
    const formattedData = transactions.map((tx) => ({
      Date: `${format(new Date(tx.createdAt), "yyyy-MM-dd HH:mm")}\t`,
      Type: tx.type,
      Product:
        tx.items.length > 0
          ? tx.items.map((i) => i.productName).join(", ")
          : "N/A",
      Customer: tx.customerName || "Guest",
      Quantity:
        tx.items.length > 0
          ? tx.items.map((i) => i.quantity).reduce((a, b) => a + b, 0)
          : 0,
      "Total Amount (₹)": tx.totalAmount || "0.00",
      "Profit (₹)": tx.profit || "0.00",
      "Payment Status": tx.paymentStatus,
    }))

    exportToCSV(
      formattedData,
      `transactions_export_${format(new Date(), "yyyy_MM_dd")}`
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-heading font-medium">
            Transaction History
          </h2>
          <p className="text-sm text-muted-foreground">
            A complete ledger of all store movements and payments.
          </p>
        </div>

        <Button
          variant="outline"
          disabled={isLoading || transactions.length === 0}
          onClick={handleExport}
        >
          {isLoading ? <Spinner /> : <Download />}
          Export to CSV
        </Button>
      </div>

      {isLoading ? (
        <LoadingComponent
          title="Loading transactions..."
          description="Hang on, we're fetching your transactions."
        />
      ) : isError ? (
        <ErrorLoadingComponent
          title="Error loading transactions"
          description={error.message}
          isRetrying={isRefetching}
          onRetry={refetch}
        />
      ) : (
        <DataTable
          columns={columns}
          data={transactions}
          manualPagination
          paginationState={pagination}
          setPaginationState={setPagination}
          rowCount={totalCount}
        />
      )}
    </div>
  )
}

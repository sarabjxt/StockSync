import { format } from "date-fns"
import type { ColumnDef } from "@tanstack/react-table"
import type { trpc } from "@/lib/trpc"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/utils"
import { TransactionDetailsSheet } from "@/components/transactions/transaction-details-sheet"

type Transaction =
  (typeof trpc.transaction.list)["~types"]["output"]["transactions"][number]

export const columns: Array<ColumnDef<Transaction>> = [
  {
    id: "date",
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {format(new Date(row.original.createdAt), "MMM d, yyyy h:mm a")}
      </span>
    ),
  },
  {
    id: "action",
    accessorKey: "type",
    header: "Action",
    cell: ({ row }) => {
      return (
        <Badge
          variant={
            row.original.type === "SALE"
              ? "default"
              : row.original.type === "PAYMENT"
                ? "secondary"
                : "outline"
          }
        >
          {row.original.type}
        </Badge>
      )
    },
  },
  {
    id: "items",
    accessorKey: "items",
    header: "Items",
    cell: ({ row }) => {
      const items = row.original.items
      if (items.length === 0) {
        return <span className="text-muted-foreground italic">None</span>
      }
      if (items.length === 1) {
        return (
          <span className="font-medium text-foreground">
            {items[0].productName} (x{items[0].quantity})
          </span>
        )
      }
      return (
        <span className="font-medium text-foreground">
          {items.length} items{" "}
          <span className="text-muted-foreground font-normal text-sm block max-w-md truncate">
            ({items.map((i) => i.productName).join(", ")})
          </span>
        </span>
      )
    },
  },
  {
    id: "customer",
    accessorKey: "customer",
    header: "Customer",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.customerName || "Guest"}
      </span>
    ),
  },
  {
    id: "payment_status",
    accessorKey: "paymentStatus",
    header: "Payment Status",
    cell: ({ row }) => {
      return (
        <Badge
          variant={
            row.original.paymentStatus === "PAID"
              ? "success"
              : row.original.paymentStatus === "UNPAID"
                ? "destructive"
                : "secondary"
          }
        >
          {row.original.paymentStatus}
        </Badge>
      )
    },
  },
  {
    id: "amount",
    accessorKey: "totalAmount",
    header: () => <div className="text-right">Total Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.original.totalAmount || "0")
      const isPayment = row.original.type === "PAYMENT"
      return (
        <div className={`text-right tabular-nums`}>
          {isPayment ? "+" : ""}
          {formatMoney(amount)}
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="text-right">
          <TransactionDetailsSheet transaction={row.original} />
        </div>
      )
    },
  },
]

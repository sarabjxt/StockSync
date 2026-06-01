import { ArrowUpDown, EllipsisVertical } from "lucide-react"
import type { ColumnDef, RowData } from "@tanstack/react-table"
import type { Customer } from "@/types/customer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatMoney } from "@/lib/utils"

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    onSettleDebt?: (customer: TData) => void
    onEditCustomer?: (customer: TData) => void
    onViewHistory?: (customer: TData) => void
  }
}

export const columns: Array<ColumnDef<Customer>> = [
  {
    id: "name",
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant={column.getIsSorted() ? "secondary" : "ghost"}
          className="-ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="font-medium font-heading">{row.original.name}</div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <div className="tabular-nums text-muted-foreground">
        {row.original.phone || "N/A"}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="tabular-nums text-muted-foreground">
        {row.original.email || "—"}
      </div>
    ),
  },
  {
    accessorKey: "storeCredit",
    header: () => {
      return <div className="text-right">Balance</div>
    },
    cell: ({ row }) => {
      const credit = parseFloat(row.original.storeCredit)

      // If balance is negative, they owe Amit money (Debt)
      const isDebt = credit < 0
      const formatted = formatMoney(Math.abs(credit))

      if (credit === 0) {
        return (
          <div className="text-right text-muted-foreground tabular-nums">
            {formatted}
          </div>
        )
      }

      return (
        <div className="flex justify-end gap-2 items-center">
          <Badge variant={isDebt ? "destructive" : "success"}>
            {isDebt ? "Owes Money" : "Credit"}
          </Badge>
          <span
            className={`tabular-nums ${isDebt ? "text-destructive" : "text-foreground"}`}
          >
            {isDebt ? `-${formatted}` : formatted}
          </span>
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const credit = parseFloat(row.original.storeCredit)
      const isDebt = credit < 0

      return (
        <div className="flex gap-2 justify-end">
          {isDebt && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.options.meta?.onSettleDebt?.(row.original)}
            >
              Settle Debt
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm">
                  <span className="sr-only">Open menu</span>
                  <EllipsisVertical />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  table.options.meta?.onViewHistory?.(row.original)
                }
              >
                View History
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  table.options.meta?.onEditCustomer?.(row.original)
                }
              >
                Edit Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]

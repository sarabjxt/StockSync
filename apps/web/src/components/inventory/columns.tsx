import { ArrowUpDown, EllipsisVertical } from "lucide-react"
import type { ColumnDef, RowData } from "@tanstack/react-table"
import type { Product } from "@/types/product"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatMoney } from "@/lib/utils"

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    onEdit?: (product: TData) => void
    onDelete?: (product: TData) => void
    onQuickAdjust?: (product: TData) => void
  }
}

export const columns: Array<ColumnDef<Product>> = [
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
          Product
          <ArrowUpDown />
        </Button>
      )
    },
    cell: ({ row }) => (
      <>
        <div className="font-medium font-heading">{row.original.name}</div>
        {row.original.sku && (
          <div className="tabular-nums text-muted-foreground mt-1">
            {row.original.sku}
          </div>
        )}
      </>
    ),
  },
  {
    id: "category",
    accessorKey: "category.name",
    header: ({ column }) => {
      return (
        <Button
          variant={column.getIsSorted() ? "secondary" : "ghost"}
          className="gap-0 -ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.category?.name || "—"}
      </div>
    ),
  },
  {
    id: "status",
    accessorFn: (row) => row.stockQuantity,
    header: "Status",
    cell: ({ row }) =>
      getStatusBadge({
        stockQuantity: row.original.stockQuantity,
        lowStockThreshold: row.original.lowStockThreshold,
      }),
  },
  {
    accessorKey: "costPrice",
    header: () => <div className="text-right">Cost Price</div>,
    cell: ({ row }) => (
      <div className="tabular-nums text-right text-sm">
        {formatMoney(Number(row.original.costPrice))}
      </div>
    ),
  },
  {
    accessorKey: "sellingPrice",
    header: () => <div className="text-right">Selling Price</div>,
    cell: ({ row }) => (
      <div className="tabular-nums text-right text-sm">
        {formatMoney(Number(row.original.sellingPrice))}
      </div>
    ),
  },
  {
    id: "margin",
    accessorFn: (row) => {
      const margin = Number(row.sellingPrice) - Number(row.costPrice)
      return (margin / Number(row.sellingPrice)) * 100
    },
    header: () => <div className="text-right">Margin</div>,
    cell: ({ row }) => (
      <div className="tabular-nums text-right text-sm">
        {getMarginPercentage({
          costPrice: row.original.costPrice,
          sellingPrice: row.original.sellingPrice,
        })}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row, table }) => {
      return (
        <div className="flex gap-2 justify-end">
          <Button
            variant="default"
            size="sm"
            onClick={() => table.options.meta?.onQuickAdjust?.(row.original)}
          >
            Quick Adjust
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="icon-sm">
                  <EllipsisVertical />
                  <span className="sr-only">Open menu</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                onClick={() => table.options.meta?.onEdit?.(row.original)}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  table.options.meta?.onDelete?.(row.original)
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]

function getStatusBadge({
  stockQuantity,
  lowStockThreshold,
}: Pick<Product, "stockQuantity" | "lowStockThreshold">) {
  if (stockQuantity === 0) {
    return <Badge variant="destructive">Out of Stock</Badge>
  }
  if (stockQuantity <= lowStockThreshold) {
    return <Badge variant="warning">Low Stock ({stockQuantity})</Badge>
  }
  if (stockQuantity > lowStockThreshold) {
    return <Badge variant="success">In Stock ({stockQuantity})</Badge>
  }
  return null
}

function getMarginPercentage({
  costPrice,
  sellingPrice,
}: Pick<Product, "costPrice" | "sellingPrice">) {
  const margin = Number(sellingPrice) - Number(costPrice)
  return ((margin / Number(sellingPrice)) * 100).toFixed(2) + "%"
}

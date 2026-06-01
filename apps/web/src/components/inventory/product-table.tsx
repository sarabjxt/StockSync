import { useState } from "react"
import {
  ArrowUpDown,
  ChevronDown,
  Columns,
  EllipsisVertical,
  Search,
} from "lucide-react"

import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type {
  ColumnDef,
  ColumnFiltersState,
  RowData,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import type { Product, Products } from "@/types/product"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatMoney } from "@/lib/utils"
import { UpdateProductSheet } from "@/components/inventory/update-product-sheet"
import { DeleteProductDialog } from "@/components/inventory/delete-product-dialog"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { QuickAdjustSheet } from "@/components/inventory/quick-adjust-sheet"

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    onEdit?: (product: TData) => void
    onDelete?: (product: TData) => void
    onQuickAdjust?: (product: TData) => void
  }
}

const columns: Array<ColumnDef<Product>> = [
  {
    id: "product",
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

export function ProductTable({ data: initialData }: { data: Products }) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [quickAdjustProduct, setQuickAdjustProduct] = useState<Product | null>(
    null
  )

  const table = useReactTable({
    data: initialData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta: {
      onEdit: (product: Product) => {
        setEditingProduct(product)
      },
      onDelete: (product: Product) => {
        setDeletingProduct(product)
      },
      onQuickAdjust: (product: Product) => {
        setQuickAdjustProduct(product)
      },
    },
  })

  return (
    <div className="space-y-4">
      <UpdateProductSheet
        product={editingProduct}
        open={!!editingProduct}
        onOpenChange={(isOpen) => {
          if (!isOpen) setEditingProduct(null)
        }}
      />
      <DeleteProductDialog
        product={deletingProduct}
        open={!!deletingProduct}
        onOpenChange={(isOpen) => {
          if (!isOpen) setDeletingProduct(null)
        }}
      />
      <QuickAdjustSheet
        product={quickAdjustProduct}
        open={!!quickAdjustProduct}
        onOpenChange={(isOpen) => {
          if (!isOpen) setQuickAdjustProduct(null)
        }}
      />
      <div className="flex items-center justify-between gap-1">
        <InputGroup className="max-w-sm lg:w-sm">
          <InputGroupInput
            placeholder="Search products..."
            onChange={(event) =>
              table.getColumn("product")?.setFilterValue(event.target.value)
            }
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm">
                  <Columns />
                  <span className="hidden lg:inline">Customize Columns</span>
                  <span className="lg:hidden">Columns</span>
                  <ChevronDown />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b bg-muted/50 hover:bg-muted/50 font-medium"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className="h-12 px-4"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="bg-transparent hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-4 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No products found matching the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

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

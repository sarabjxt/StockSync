import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { CircleAlert, Package, PlusIcon, RotateCcw } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import type { Product } from "@/types/product"
import {
  CreateProductSheet,
  CreateProductSheetTrigger,
} from "@/components/inventory/create-product-sheet"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { trpc } from "@/lib/trpc"
import { Spinner } from "@/components/ui/spinner"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "@/components/inventory/columns"
import { UpdateProductSheet } from "@/components/inventory/update-product-sheet"
import { DeleteProductDialog } from "@/components/inventory/delete-product-dialog"
import { QuickAdjustSheet } from "@/components/inventory/quick-adjust-sheet"

export const Route = createFileRoute("/_protected/_sidebar/inventory")({
  component: RouteComponent,
})

function RouteComponent() {
  const {
    data: products,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery(trpc.product.list.queryOptions())

  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [quickAdjustProduct, setQuickAdjustProduct] = useState<Product | null>(
    null
  )

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-heading font-medium">Inventory</h2>
            <p className="text-sm text-muted-foreground">
              Products, stock levels, and pricing.
            </p>
          </div>
          <CreateProductSheetTrigger
            render={
              <Button size="lg">
                <PlusIcon />
                Add Product
              </Button>
            }
          />
        </div>
        <div>
          {isLoading ? (
            <LoadingInventory />
          ) : isError ? (
            <ErrorLoadingInventory
              message={error.message}
              isRetrying={isRefetching}
              onRetry={refetch}
            />
          ) : products && products.length > 0 ? (
            <DataTable
              data={products}
              columns={columns}
              searchColumnId="name"
              searchPlaceholder="Search products..."
              meta={{
                onEdit: setEditingProduct,
                onDelete: setDeletingProduct,
                onQuickAdjust: setQuickAdjustProduct,
              }}
            />
          ) : (
            <EmptyInventory />
          )}
        </div>
      </div>
      <CreateProductSheet />
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
    </>
  )
}

function LoadingInventory() {
  return (
    <Empty className="border border-dashed md:py-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Spinner />
        </EmptyMedia>
        <EmptyTitle className="text-base">Loading Inventory...</EmptyTitle>
        <EmptyDescription>
          Hang on, we're fetching your products and stock levels.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function ErrorLoadingInventory({
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
        <EmptyTitle className="text-base">Error loading inventory</EmptyTitle>
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

function EmptyInventory() {
  return (
    <Empty className="border border-dashed md:py-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Package />
        </EmptyMedia>
        <EmptyTitle className="text-base">No products found</EmptyTitle>
        <EmptyDescription>
          Start by adding your first product to track stock and sales.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <CreateProductSheetTrigger
          render={
            <Button variant="outline" size="sm">
              <PlusIcon />
              Add Product
            </Button>
          }
        />
      </EmptyContent>
    </Empty>
  )
}

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { toast } from "sonner"

import type React from "react"
import type { Product } from "@/types/product"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { handleTrpcError, trpc } from "@/lib/trpc"
import { CategoryDialog } from "@/components/inventory/category-dialog"
import { ProductForm } from "@/components/inventory/product-form"

const productSheet = SheetPrimitive.createHandle()

export function UpdateProductSheet({
  product,
  ...props
}: Omit<React.ComponentProps<typeof Sheet>, "handle" | "children"> & {
  product: Product | null
}) {
  const queryClient = useQueryClient()

  const updateProduct = useMutation(
    trpc.product.update.mutationOptions({
      onSuccess: () => {
        toast.success("Product updated successfully.")

        queryClient.invalidateQueries({
          queryKey: trpc.product.list.queryKey(),
        })

        productSheet.close()
      },
      onError: (error) => {
        handleTrpcError(error)
      },
    })
  )

  return (
    <>
      <Sheet {...props} handle={productSheet}>
        <SheetContent className="data-[side=right]:sm:max-w-lg">
          <SheetHeader className="md:gap-1">
            <SheetTitle className="text-lg">Update Product</SheetTitle>
            <SheetDescription>
              Update the details of your product here. Click save when you're
              done.
            </SheetDescription>
          </SheetHeader>
          {product && (
            <ProductForm
              defaultValues={{
                ...product,
                sku: product.sku || "",
                costPrice: Number(product.costPrice),
                sellingPrice: Number(product.sellingPrice),
              }}
              onSubmit={async (values) => {
                await updateProduct.mutateAsync({
                  ...values,
                  categoryId: values.category?.id,
                  id: product.id,
                })
              }}
              isSubmitting={updateProduct.isPending}
            />
          )}
        </SheetContent>
      </Sheet>
      <CategoryDialog />
    </>
  )
}

export function UpateProductSheetTrigger(
  props: React.ComponentProps<typeof SheetTrigger>
) {
  return <SheetTrigger {...props} handle={productSheet} />
}

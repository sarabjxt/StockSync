import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type React from "react"
import type { Product } from "@/types/product"
import { handleTrpcError, trpc } from "@/lib/trpc"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"

const deleteProductDialogHandle = AlertDialogPrimitive.createHandle()

export function DeleteProductDialog({
  product,
  ...props
}: React.ComponentProps<typeof AlertDialog> & {
  product: Product | null
}) {
  const queryClient = useQueryClient()

  const deleteProduct = useMutation(
    trpc.product.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Product deleted successfully.")
        queryClient.invalidateQueries({
          queryKey: trpc.product.list.queryKey(),
        })
      },
      onError: (error) => {
        handleTrpcError(error)
      },
    })
  )

  async function handleDelete() {
    if (!product) return
    await deleteProduct.mutateAsync({
      id: product.id,
    })
    deleteProductDialogHandle.close()
  }

  if (!product) return

  return (
    <AlertDialog {...props} handle={deleteProductDialogHandle}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            product and remove its data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteProduct.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteProduct.isPending}
            onClick={handleDelete}
          >
            {deleteProduct.isPending && <Spinner />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function DeleteProductDialogTrigger(
  props: React.ComponentProps<typeof AlertDialogTrigger>
) {
  return <AlertDialogTrigger {...props} handle={deleteProductDialogHandle} />
}

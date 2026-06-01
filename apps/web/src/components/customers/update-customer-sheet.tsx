import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { toast } from "sonner"
import type { Customer } from "@/types/customer"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { handleTrpcError, trpc } from "@/lib/trpc"
import { CustomerForm } from "@/components/customers/customer-form"

const customerSheet = SheetPrimitive.createHandle()

export function UpdateCustomerSheet({
  customer,
  ...props
}: Omit<React.ComponentProps<typeof Sheet>, "handle" | "children"> & {
  customer: Customer | null
}) {
  const queryClient = useQueryClient()

  const updateCustomer = useMutation(
    trpc.customer.update.mutationOptions({
      onSuccess: () => {
        toast.success("Customer updated successfully.")

        queryClient.invalidateQueries({
          queryKey: trpc.customer.list.queryKey(),
        })

        customerSheet.close()
      },
      onError: (error) => {
        handleTrpcError(error)
      },
    })
  )

  return (
    <>
      <Sheet {...props} handle={customerSheet}>
        <SheetContent className="data-[side=right]:sm:max-w-lg">
          <SheetHeader className="md:gap-1">
            <SheetTitle className="text-lg">Update Customer</SheetTitle>
            <SheetDescription>
              Update the details of the customer here. Click save when you're
              done.
            </SheetDescription>
          </SheetHeader>
          {customer && (
            <CustomerForm
              defaultValues={{
                name: customer.name,
                phone: customer.phone || "",
                email: customer.email || "",
                notes: customer.notes || "",
              }}
              onSubmit={async (values) => {
                await updateCustomer.mutateAsync({
                  ...values,
                  id: customer.id,
                })
              }}
              isSubmitting={updateCustomer.isPending}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

export function UpdateCustomerSheetTrigger(
  props: React.ComponentProps<typeof SheetTrigger>
) {
  return <SheetTrigger {...props} handle={customerSheet} />
}

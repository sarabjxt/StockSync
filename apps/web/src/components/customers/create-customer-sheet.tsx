import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"

import { toast } from "sonner"
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

export function CreateCustomerSheet(
  props: Omit<React.ComponentProps<typeof Sheet>, "handle" | "children">
) {
  const queryClient = useQueryClient()

  const createCustomer = useMutation(
    trpc.customer.create.mutationOptions({
      onSuccess: () => {
        toast.success("Customer created successfully.")

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
            <SheetTitle className="text-lg">New Customer</SheetTitle>
            <SheetDescription>
              Enter the details of the new customer here. Click save when you're
              done.
            </SheetDescription>
          </SheetHeader>
          <CustomerForm
            onSubmit={async (values) => {
              await createCustomer.mutateAsync({
                ...values,
              })
            }}
            isSubmitting={createCustomer.isPending}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}

export function CreateCustomerSheetTrigger(
  props: React.ComponentProps<typeof SheetTrigger>
) {
  return <SheetTrigger {...props} handle={customerSheet} />
}

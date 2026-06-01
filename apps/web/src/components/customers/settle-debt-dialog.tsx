import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { Banknote, IndianRupee } from "lucide-react"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { Customer } from "@/types/customer"
import { handleTrpcError, trpc } from "@/lib/trpc"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { formatMoney } from "@/lib/utils"

const paymentFormSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  notes: z.string().max(255).optional(),
})

type SettleDebtDialogProps = {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettleDebtDialog({
  customer,
  open,
  onOpenChange,
}: SettleDebtDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {customer && (
        <SettleDebtDialogImpl customer={customer} onOpenChange={onOpenChange} />
      )}
    </Dialog>
  )
}

function SettleDebtDialogImpl({
  customer,
  onOpenChange,
}: {
  customer: Customer
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()

  const processPayment = useMutation(
    trpc.customer.processPayment.mutationOptions({
      onSuccess: () => {
        toast.success("Payment recorded successfully!")

        queryClient.invalidateQueries({
          queryKey: trpc.customer.list.queryKey(),
        })
        queryClient.invalidateQueries({
          queryKey: trpc.transaction.list.queryKey(),
        })

        onOpenChange(false)
        form.reset()
      },
      onError: (err) => handleTrpcError(err),
    })
  )

  const defaultValues: z.infer<typeof paymentFormSchema> = {
    amount: Math.abs(Number(customer.storeCredit)),
    notes: "Account Payment",
  }

  const form = useForm({
    defaultValues: defaultValues,
    validators: { onChange: paymentFormSchema },
    onSubmit: async ({ value }) => {
      await processPayment.mutateAsync({
        customerId: customer.id,
        amount: value.amount,
        notes: value.notes,
      })
    },
  })

  const currentDebt = Math.abs(Number(customer.storeCredit))
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Settle Debt: {customer.name}</DialogTitle>
        <DialogDescription>
          Current Balance:{" "}
          <strong className="text-destructive font-bold">
            {formatMoney(currentDebt)}
          </strong>
        </DialogDescription>
      </DialogHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        {/* Payment Amount */}
        <form.Field
          name="amount"
          children={(field) => {
            const isInvalid =
              field.state.meta.isDirty && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Payment Amount</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <IndianRupee />
                  </InputGroupAddon>
                  <InputGroupInput
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                    type="number"
                    min="0.01"
                    step="0.01"
                    aria-invalid={isInvalid}
                  />
                </InputGroup>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        {/* Notes */}
        <form.Field
          name="notes"
          children={(field) => {
            const isInvalid =
              field.state.meta.isDirty && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Notes (Optional)</FieldLabel>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <DialogFooter>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? <Spinner /> : <Banknote />}
                Accept Payment
              </Button>
            )}
          />
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

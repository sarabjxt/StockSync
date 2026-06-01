import * as React from "react"
import * as z from "zod"
import { useForm } from "@tanstack/react-form"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { handleTrpcError, trpc } from "@/lib/trpc"
import { Spinner } from "@/components/ui/spinner"

const categoryDialog = DialogPrimitive.createHandle()

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
})

export function CategoryDialog() {
  const queryClient = useQueryClient()

  const createCategory = useMutation(
    trpc.category.create.mutationOptions({
      onSuccess: () => {
        toast.success("Category created successfully.")

        queryClient.invalidateQueries({
          queryKey: trpc.category.list.queryKey(),
        })

        categoryDialog.close()
      },
      onError: (error) => {
        handleTrpcError(error)
      },
    })
  )

  const form = useForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onChange: categorySchema,
      onSubmit: categorySchema,
    },
    onSubmit: async ({ value }) => {
      await createCategory.mutateAsync({
        name: value.name,
      })
    },
  })

  return (
    <Dialog handle={categoryDialog}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
          <DialogDescription>
            Organize your products by creating a new category.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid flex-1 auto-rows-min gap-6"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <form.Field
            name="name"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
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
            <Button type="submit" disabled={createCategory.isPending}>
              {createCategory.isPending && <Spinner />}
              Save Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * A trigger component for the CategoryDialog that can be used anywhere in the component tree.
 * Using this outside of the Dialog component (e.g., inside a Sheet or Combobox) helps
 * prevent common UI issues like z-index conflicts, focus management loops, or
 * unexpected "outside click" closures of parent overlays.
 */
export function CategoryDialogTrigger(
  props: React.ComponentProps<typeof DialogTrigger>
) {
  return <DialogTrigger {...props} handle={categoryDialog} />
}

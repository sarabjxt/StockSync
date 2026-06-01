import z from "zod"
import { useQuery } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { IndianRupee, Plus } from "lucide-react"

import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { CategoryDialogTrigger } from "@/components/inventory/category-dialog"
import { Separator } from "@/components/ui/separator"

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  sku: z.string().max(100, "SKU must be less than 100 characters").optional(),
  category: z
    .object({
      id: z.string().min(1, "Category is required"),
      name: z.string().min(1, "Category is required"),
    })
    .nullable(),
  costPrice: z.number().positive("Cost price must be a positive number"),
  sellingPrice: z.number().positive("Selling price must be a positive number"),
  stockQuantity: z.int().nonnegative(),
  lowStockThreshold: z.int().nonnegative(),
})

const defaultProduct: z.infer<typeof productSchema> = {
  name: "",
  sku: undefined,
  category: null,
  costPrice: 0,
  sellingPrice: 0,
  stockQuantity: 0,
  lowStockThreshold: 5,
}

type ProductFormProps = {
  defaultValues?: z.infer<typeof productSchema>
  onSubmit: (values: z.infer<typeof productSchema>) => Promise<void>
  isSubmitting: boolean
}

export function ProductForm({
  defaultValues = defaultProduct,
  onSubmit,
  isSubmitting,
}: ProductFormProps) {
  const {
    data: categories,
    isLoading,
    isFetching,
  } = useQuery(
    trpc.category.list.queryOptions(undefined, {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    })
  )

  const isCategoriesLoading = isLoading || isFetching

  const form = useForm({
    defaultValues,
    validators: { onChange: productSchema },
    onSubmit: async ({ value }) => await onSubmit(value),
  })

  return (
    <form
      className="grid flex-1 auto-rows-min gap-6 px-4"
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
            field.state.meta.isDirty && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Product Name</FieldLabel>
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
      <div className="grid grid-cols-2 gap-4">
        <form.Field
          name="sku"
          children={(field) => {
            const isInvalid =
              field.state.meta.isDirty && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>SKU</FieldLabel>
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
        <form.Field
          name="category"
          children={(field) => {
            const isInvalid =
              field.state.meta.isDirty && !field.state.meta.isValid

            const items =
              categories?.map((category) => ({
                id: category.id,
                name: category.name,
              })) || []

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Category</FieldLabel>

                <Combobox
                  items={items}
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  itemToStringLabel={(item: (typeof items)[number]) =>
                    item.name
                  }
                  onValueChange={(value) =>
                    field.handleChange(
                      value ?? {
                        id: "",
                        name: "",
                      }
                    )
                  }
                >
                  <ComboboxInput placeholder="Select a category" />
                  <ComboboxContent>
                    <ComboboxEmpty>
                      <div className="flex flex-col items-center justify-center text-center gap-2 p-4 text-muted-foreground">
                        {isCategoriesLoading ? (
                          <>
                            <Spinner className="size-4 " />
                            <p className="text-sm">
                              Hang on, loading categories...
                            </p>
                          </>
                        ) : (
                          <>
                            <p>"No categories found.</p>
                          </>
                        )}
                      </div>
                    </ComboboxEmpty>
                    <ComboboxList>
                      {(category: (typeof items)[number]) => (
                        <ComboboxItem key={category.id} value={category}>
                          {category.name}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                    <Separator />
                    {items.length !== 0 && (
                      <div className="w-full flex flex-col justify-center p-2">
                        <CategoryDialogTrigger
                          render={
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              <Plus />
                              Create Category
                            </Button>
                          }
                        />
                      </div>
                    )}
                  </ComboboxContent>
                </Combobox>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <form.Field
          name="costPrice"
          children={(field) => {
            const isInvalid =
              field.state.meta.isDirty && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Cost Price</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <IndianRupee />
                  </InputGroupAddon>
                  <InputGroupInput
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      field.handleChange(e.target.valueAsNumber)
                    }}
                    type="number"
                    min={0}
                    step="0.01"
                    aria-invalid={isInvalid}
                  />
                </InputGroup>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <form.Field
          name="sellingPrice"
          children={(field) => {
            const isInvalid =
              field.state.meta.isDirty && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Selling Price</FieldLabel>
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
                    min={0}
                    step="0.01"
                    aria-invalid={isInvalid}
                  />
                </InputGroup>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <form.Field
          name="stockQuantity"
          children={(field) => {
            const isInvalid =
              field.state.meta.isDirty && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Stock</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                  type="number"
                  min={0}
                  step="1"
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
        <form.Field
          name="lowStockThreshold"
          children={(field) => {
            const isInvalid =
              field.state.meta.isDirty && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Low-stock at</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                  type="number"
                  min={0}
                  step="1"
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Spinner />}
        Save Product
      </Button>
    </form>
  )
}

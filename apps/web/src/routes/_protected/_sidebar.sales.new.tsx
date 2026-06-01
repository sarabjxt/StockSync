import { useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, History, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { useForm, useStore } from "@tanstack/react-form"
import { z } from "zod"
import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn, formatMoney } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { CustomerCombobox } from "@/components/customer-combobox"
import {
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const Route = createFileRoute("/_protected/_sidebar/sales/new")({
  component: RouteComponent,
})

type LineItem = {
  id: string
  productId: string | null
  quantity: number
}

function RouteComponent() {
  const queryClient = useQueryClient()

  const { data: products = [] } = useQuery(trpc.product.list.queryOptions())
  const { data: recentSales = [], isLoading: isLoadingRecentSales } = useQuery(
    trpc.transaction.getRecentSales.queryOptions()
  )

  const createSale = useMutation(
    trpc.transaction.createSale.mutationOptions({
      onSuccess: () => {
        toast.success("Sale completed successfully!")
        form.reset()
        queryClient.invalidateQueries({
          queryKey: trpc.product.list.queryKey(),
        })
        queryClient.invalidateQueries({
          queryKey: trpc.transaction.list.queryKey(),
        })
        queryClient.invalidateQueries({
          queryKey: trpc.transaction.getRecentSales.queryKey(),
        })
      },
      onError: (error) => {
        toast.error(error.message || "Failed to complete sale")
      },
    })
  )

  const saleFormSchema = useMemo(() => {
    return z
      .object({
        customerId: z.uuid().nullable(),
        paymentStatus: z.enum(["PAID", "UNPAID", "PARTIAL"]),
        amountPaid: z.number().nonnegative(),
        paymentMethod: z.enum(["CASH", "CARD", "UPI"]),
        notes: z.string(),
        items: z
          .array(
            z.object({
              id: z.string(),
              productId: z.string().uuid().nullable(),
              quantity: z.number().int().positive(),
            })
          )
          .min(1, "Please add at least one item"),
      })
      .superRefine((data, ctx) => {
        if (
          (data.paymentStatus === "UNPAID" ||
            data.paymentStatus === "PARTIAL") &&
          !data.customerId
        ) {
          ctx.addIssue({
            code: "custom",
            message:
              "A customer must be selected for unpaid (Udhar) or partial sales.",
            path: ["customerId"],
          })
        }

        if (data.paymentStatus === "PARTIAL") {
          if (data.amountPaid <= 0) {
            ctx.addIssue({
              code: "custom",
              message: "Amount paid must be greater than 0.",
              path: ["amountPaid"],
            })
          }

          const validItems = data.items.filter(
            (item) => item.productId !== null
          )
          const total = validItems.reduce((acc, item) => {
            const prod = products.find((p) => p.id === item.productId)
            return acc + (prod ? Number(prod.sellingPrice) * item.quantity : 0)
          }, 0)

          if (data.amountPaid >= total) {
            ctx.addIssue({
              code: "custom",
              message: `Amount paid must be less than the total cart amount (${formatMoney(total)}).`,
              path: ["amountPaid"],
            })
          }
        }
      })
  }, [products])

  const defaultValues = useMemo<z.infer<typeof saleFormSchema>>(() => ({
    customerId: null,
    paymentStatus: "PAID",
    amountPaid: 0,
    paymentMethod: "CASH",
    notes: "",
    items: [
      {
        id: crypto.randomUUID(),
        productId: null,
        quantity: 1,
      },
    ],
  }), [])

  const form = useForm({
    defaultValues,
    validators: { onChange: saleFormSchema },
    onSubmit: async ({ value }) => {
      const validItems = value.items.filter((item) => item.productId !== null)
      if (validItems.length === 0) {
        toast.error("Please add at least one valid product.")
        return
      }

      await createSale.mutateAsync({
        customerId: value.customerId || undefined,
        items: validItems.map((item) => ({
          productId: item.productId as string,
          quantity: item.quantity,
        })),
        paymentStatus: value.paymentStatus,
        amountPaid:
          value.paymentStatus === "PARTIAL" ? value.amountPaid : undefined,
        paymentMethod:
          value.paymentStatus !== "UNPAID" ? value.paymentMethod : undefined,
        notes: value.notes || undefined,
      })
    },
  })

  // Subscribe to changes to compute derived state reactively
  const items = useStore(form.store, (state) => state.values.items)

  const validItems = useMemo(
    () => items.filter((item) => item.productId !== null),
    [items]
  )

  const cartTotal = useMemo(() => {
    return validItems.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId)
      if (!product) return total
      return total + Number(product.sellingPrice) * item.quantity
    }, 0)
  }, [validItems, products])

  return (
    <div className="max-w-4xl flex flex-col gap-6 pb-12">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-heading font-semibold">New Sale</h2>
        <p className="text-muted-foreground text-sm">
          Build a new invoice to record a direct transaction.
        </p>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <CardContent className="space-y-6">
            <form.Field
              name="customerId"
              children={(field) => (
                <Field
                  className="max-w-md"
                  data-invalid={field.state.meta.errors.length > 0}
                >
                  <FieldLabel htmlFor="pos-customer-combobox">
                    Select Customer
                  </FieldLabel>
                  <CustomerCombobox
                    id="pos-customer-combobox"
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val)}
                    placeholder="Walk-in Customer (Guest)"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-xs text-destructive mt-1 font-medium">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </Field>
              )}
            />

            <form.Field
              name="items"
              mode="array"
              children={(itemsField) => (
                <Field>
                  <FieldLabel>Line Items</FieldLabel>
                  <div className="flex flex-col gap-4">
                    {itemsField.state.value.map((item, index) => (
                      <LineItemRow
                        key={item.id}
                        index={index}
                        item={item}
                        products={products}
                        onUpdate={(updates) => {
                          const current = [...itemsField.state.value]
                          current[index] = { ...current[index], ...updates }
                          itemsField.handleChange(current)
                        }}
                        onRemove={() => itemsField.removeValue(index)}
                      />
                    ))}
                    {itemsField.state.value.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          itemsField.pushValue({
                            id: crypto.randomUUID(),
                            productId: null,
                            quantity: 1,
                          })
                        }
                        className="ml-10 w-fit"
                      >
                        <Plus />
                        Add Item
                      </Button>
                    )}
                    {itemsField.state.value.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                        <ShoppingBag className="size-8 opacity-50 mb-2" />
                        <p>No items added to invoice.</p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            itemsField.pushValue({
                              id: crypto.randomUUID(),
                              productId: null,
                              quantity: 1,
                            })
                          }
                          className="mt-2"
                        >
                          Add an item
                        </Button>
                      </div>
                    )}
                  </div>
                </Field>
              )}
            />

            <form.Field
              name="paymentStatus"
              children={(field) => (
                <Field className="max-w-md">
                  <FieldLabel htmlFor="payment-status-select">
                    Payment Status
                  </FieldLabel>
                  <Select
                    id="payment-status-select"
                    value={field.state.value}
                    onValueChange={(val: any) => {
                      field.handleChange(val)
                      form.setFieldValue("amountPaid", 0)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAID">Paid in Full</SelectItem>
                      <SelectItem value="UNPAID">
                        Add to Udhar (Unpaid)
                      </SelectItem>
                      <SelectItem value="PARTIAL">Partial Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />

            <form.Subscribe
              selector={(state) => [state.values.paymentStatus]}
              children={([status]) => {
                if (status !== "PARTIAL") return null
                return (
                  <form.Field
                    name="amountPaid"
                    children={(field) => {
                      const hasError = field.state.meta.errors.length > 0
                      return (
                        <Field className="max-w-md" data-invalid={hasError}>
                          <FieldLabel htmlFor="amount-paid-input">
                            Amount Paid
                          </FieldLabel>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              ₹
                            </span>
                            <Input
                              id="amount-paid-input"
                              type="number"
                              placeholder="0.00"
                              value={field.state.value || ""}
                              onChange={(e) =>
                                field.handleChange(Number(e.target.value) || 0)
                              }
                              className={cn(
                                "pl-7",
                                hasError &&
                                  "border-destructive focus-visible:ring-destructive"
                              )}
                            />
                          </div>
                          {hasError ? (
                            <p className="text-xs text-destructive mt-1 font-medium">
                              {field.state.meta.errors.join(", ")}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-1">
                              Remaining debt of{" "}
                              {formatMoney(cartTotal - field.state.value)} will
                              be added to the customer's Udhar balance.
                            </p>
                          )}
                        </Field>
                      )
                    }}
                  />
                )
              }}
            />

            <form.Subscribe
              selector={(state) => [state.values.paymentStatus]}
              children={([status]) => {
                if (status === "UNPAID") return null
                return (
                  <form.Field
                    name="paymentMethod"
                    children={(field) => (
                      <Field>
                        <FieldLabel>Payment Method</FieldLabel>
                        <RadioGroup
                          value={field.state.value}
                          onValueChange={(val: any) => field.handleChange(val)}
                          className="flex flex-col sm:flex-row w-full"
                        >
                          <FieldLabel htmlFor="cash">
                            <Field orientation="horizontal">
                              <FieldContent>
                                <FieldTitle>Cash</FieldTitle>
                              </FieldContent>
                              <RadioGroupItem value="CASH" id="cash" />
                            </Field>
                          </FieldLabel>

                          <FieldLabel htmlFor="card">
                            <Field orientation="horizontal">
                              <FieldContent>
                                <FieldTitle>Card</FieldTitle>
                              </FieldContent>
                              <RadioGroupItem value="CARD" id="card" />
                            </Field>
                          </FieldLabel>
                          <FieldLabel htmlFor="upi">
                            <Field orientation="horizontal">
                              <FieldContent>
                                <FieldTitle>UPI</FieldTitle>
                              </FieldContent>
                              <RadioGroupItem value="UPI" id="upi" />
                            </Field>
                          </FieldLabel>
                        </RadioGroup>
                      </Field>
                    )}
                  />
                )
              }}
            />

            <form.Field
              name="notes"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor="transaction-notes">
                    Transaction Notes
                  </FieldLabel>
                  <Textarea
                    id="transaction-notes"
                    placeholder="Any additional info..."
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="min-h-20 max-w-md"
                  />
                </Field>
              )}
            />

            {/* Total & Checkout Section */}
            <div className="w-full max-w-md flex flex-col gap-2 items-end">
              <div className="flex justify-between items-baseline w-full">
                <span className="font-medium font-heading text-lg">Total</span>
                <span className="font-bold text-2xl tabular-nums">
                  {formatMoney(cartTotal)}
                </span>
              </div>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    size="lg"
                    className="w-full mt-2 font-medium"
                    type="submit"
                    disabled={
                      validItems.length === 0 ||
                      createSale.isPending ||
                      !canSubmit ||
                      isSubmitting
                    }
                  >
                    {createSale.isPending || isSubmitting ? (
                      <>
                        <Spinner />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="size-4" />
                        Record Sale
                      </>
                    )}
                  </Button>
                )}
              />
            </div>
          </CardContent>
        </form>
      </Card>

      {/* Recent Sales History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="size-5 text-muted-foreground" />
            Recent Sales Today
          </CardTitle>
          <CardDescription>
            Quickly verify or void recently recorded sales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRecentSales ? (
            <div className="py-8 flex justify-center">
              <Spinner />
            </div>
          ) : recentSales.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No sales recorded today yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentSales.map((sale: any) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">
                      {sale.customerName || "Walk-in Customer"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(sale.createdAt), "hh:mm a")} •{" "}
                      {sale.paymentMethod || "PAID"}
                    </span>
                  </div>
                  <div className="font-semibold tabular-nums">
                    {formatMoney(Number(sale.totalAmount))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function LineItemRow({
  index,
  item,
  products,
  onUpdate,
  onRemove,
}: {
  index: number
  item: LineItem
  products: Array<any>
  onUpdate: (updates: Partial<LineItem>) => void
  onRemove: () => void
}) {
  const [searchQuery, setSearchQuery] = useState("")

  const productItems = useMemo(() => {
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku || "",
      sellingPrice: Number(p.sellingPrice) || 0,
      stockQuantity: p.stockQuantity || 0,
    }))
  }, [products])

  const selectedProductObj = useMemo(() => {
    return item.productId
      ? productItems.find((p) => p.id === item.productId) || null
      : null
  }, [item.productId, productItems])

  const lineTotal = selectedProductObj
    ? selectedProductObj.sellingPrice * item.quantity
    : 0

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex items-center justify-center size-6 rounded-full bg-muted text-muted-foreground text-xs font-medium shrink-0 mt-2 sm:mt-0">
        {index + 1}
      </div>

      <div className="flex-1 w-full min-w-[200px]">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block sm:hidden">
          Product
        </label>
        <Combobox
          autoHighlight
          items={productItems}
          value={selectedProductObj}
          inputValue={searchQuery}
          onInputValueChange={setSearchQuery}
          onValueChange={(val) => {
            onUpdate({ productId: val?.id || null, quantity: 1 })
            if (!val) setSearchQuery("")
          }}
          itemToStringLabel={(p) => p.name}
        >
          <ComboboxInput
            placeholder="Search product by name or SKU..."
            className="w-full h-9"
          />
          <ComboboxContent>
            <ComboboxEmpty className="p-3 text-sm text-muted-foreground text-center">
              No products found.
            </ComboboxEmpty>
            <ComboboxList className="p-1 max-h-[290px] overflow-y-auto">
              {(p) => {
                const isOutOfStock = p.stockQuantity <= 0
                return (
                  <ComboboxItem
                    key={p.id}
                    value={p}
                    disabled={isOutOfStock}
                    className={cn(
                      "hover:bg-accent data-highlighted:bg-accent text-sm py-2 px-3 rounded-md cursor-pointer transition-colors flex items-center justify-between gap-3 border border-transparent",
                      isOutOfStock && "opacity-50"
                    )}
                  >
                    <div className="flex flex-col text-left overflow-hidden">
                      <span className="font-medium text-foreground truncate">
                        {p.name}
                      </span>
                      {p.sku && (
                        <span className="text-xs text-muted-foreground font-mono mt-0.5">
                          SKU: {p.sku}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-medium text-muted-foreground">
                        {formatMoney(p.sellingPrice)}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-semibold",
                          isOutOfStock
                            ? "text-destructive"
                            : "text-muted-foreground"
                        )}
                      >
                        {isOutOfStock
                          ? "Out of stock"
                          : `${p.stockQuantity} in stock`}
                      </span>
                    </div>
                  </ComboboxItem>
                )
              }}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
        <div className="flex items-center gap-1 bg-muted/30 border border-border rounded-lg p-0.25">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() =>
              onUpdate({ quantity: Math.max(1, item.quantity - 1) })
            }
            disabled={item.quantity <= 1 || !item.productId}
          >
            <Minus />
          </Button>
          <Input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => {
              let val = Number(e.target.value) || 1
              if (
                selectedProductObj &&
                val > selectedProductObj.stockQuantity
              ) {
                val = selectedProductObj.stockQuantity
              }
              onUpdate({ quantity: Math.max(1, val) })
            }}
            disabled={!item.productId}
            className="h-8 w-12 border-0 bg-transparent text-center focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-semibold tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none px-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              if (selectedProductObj) {
                onUpdate({
                  quantity: Math.min(
                    item.quantity + 1,
                    selectedProductObj.stockQuantity
                  ),
                })
              }
            }}
            disabled={
              !item.productId ||
              Boolean(
                selectedProductObj &&
                item.quantity >= selectedProductObj.stockQuantity
              )
            }
          >
            <Plus />
          </Button>
        </div>

        <div className="w-24 text-right shrink-0">
          <span className="font-medium text-muted-foreground tabular-nums">
            {formatMoney(lineTotal)}
          </span>
        </div>

        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}

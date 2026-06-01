import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import {
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  Minus,
  Plus,
  PlusCircle,
  RotateCcw,
  ShoppingBag,
} from "lucide-react"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { Product } from "@/types/product"
import { handleTrpcError, trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { cn, formatMoney } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { CustomerCombobox } from "@/components/customer-combobox"

const transactionTypes = [
  "SALE",
  "RESTOCK",
  "DAMAGE",
  "RETURN",
  "MANUAL_CORRECTION",
] as const
const paymentStatuses = ["PAID", "UNPAID", "PARTIAL"] as const

const adjustFormSchema = z.object({
  type: z.enum(transactionTypes),
  quantity: z.number().int().min(1, "Must adjust by at least 1"),
  customerId: z.uuid("Invalid customer").nullable().optional(),
  paymentStatus: z.enum(paymentStatuses),
  referenceId: z.string().max(255).optional(),
  notes: z.string().max(255).optional(),
})

const defaultValues: z.infer<typeof adjustFormSchema> = {
  type: "SALE",
  quantity: 1,
  customerId: null,
  paymentStatus: "PAID",
  referenceId: "",
  notes: "",
}

type QuickAdjustSheetProps = {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const themeMap = {
  SALE: {
    accent: "text-primary-foreground bg-primary/30 border-primary/20",
    glow: "shadow-sm border-border",
    button: "bg-primary text-primary-foreground hover:bg-primary/90",
    previewText: "text-primary-foreground",
    previewBg: "bg-primary/30 text-primary-foreground border border-primary/20",
    iconColor: "text-primary-foreground",
    focusRing:
      "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary",
    label: "Sale",
  },
  RESTOCK: {
    accent: "text-primary-foreground bg-primary/30 border-primary/20",
    glow: "shadow-sm border-border",
    button: "bg-primary text-primary-foreground hover:bg-primary/90",
    previewText: "text-primary-foreground",
    previewBg: "bg-primary/30 text-primary-foreground border border-primary/20",
    iconColor: "text-primary-foreground",
    focusRing:
      "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary",
    label: "Restock",
  },
  RETURN: {
    accent: "text-primary-foreground bg-primary/30 border-primary/20",
    glow: "shadow-sm border-border",
    button: "bg-primary text-primary-foreground hover:bg-primary/90",
    previewText: "text-primary-foreground",
    previewBg: "bg-primary/30 text-primary-foreground border border-primary/20",
    iconColor: "text-primary-foreground",
    focusRing:
      "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary",
    label: "Customer Return",
  },
  DAMAGE: {
    accent: "text-destructive bg-destructive/10 border-destructive/20",
    glow: "shadow-sm border-border",
    button:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    previewText: "text-destructive",
    previewBg:
      "bg-destructive/10 text-destructive border border-destructive/20",
    iconColor: "text-destructive",
    focusRing:
      "focus-within:border-destructive focus-within:ring-1 focus-within:ring-destructive",
    label: "Damaged / Loss",
  },
  MANUAL_CORRECTION: {
    accent: "text-foreground bg-muted border-border",
    glow: "shadow-sm border-border",
    button:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
    previewText: "text-foreground",
    previewBg: "bg-muted text-foreground border border-border",
    iconColor: "text-foreground",
    focusRing:
      "focus-within:border-ring focus-within:ring-1 focus-within:ring-ring",
    label: "Manual Audit",
  },
} as const

const ACTIONS = [
  { value: "SALE" as const, label: "Sale", icon: ShoppingBag },
  { value: "RESTOCK" as const, label: "Restock", icon: PlusCircle },
  { value: "RETURN" as const, label: "Return", icon: RotateCcw },
  { value: "DAMAGE" as const, label: "Damage", icon: AlertTriangle },
  { value: "MANUAL_CORRECTION" as const, label: "Audit", icon: ArrowRightLeft },
]

export function QuickAdjustSheet({
  product,
  open,
  onOpenChange,
}: QuickAdjustSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:sm:max-w-lg">
        {product && (
          <QuickAdjustSheetImpl product={product} onOpenChange={onOpenChange} />
        )}
      </SheetContent>
    </Sheet>
  )
}

function QuickAdjustSheetImpl({
  product,
  onOpenChange,
}: {
  product: Product
  onOpenChange: (val: boolean) => void
}) {
  const queryClient = useQueryClient()

  const customerListOptions = trpc.customer.list.queryOptions()

  const adjustStock = useMutation(
    trpc.product.adjustStock.mutationOptions({
      onSuccess: async () => {
        toast.success("Transaction recorded successfully!")
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.product.list.queryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: customerListOptions.queryKey,
          }),
          queryClient.invalidateQueries({
            queryKey: trpc.analytics.getDashboardStats.queryKey(),
          }),
        ])
        onOpenChange(false)
        form.reset()
      },
      onError: (err) => handleTrpcError(err),
    })
  )

  const form = useForm({
    defaultValues,
    validators: { onChange: adjustFormSchema },
    onSubmit: async ({ value }) => {
      const isNegative = value.type === "SALE" || value.type === "DAMAGE"
      const finalQuantityChange = isNegative
        ? -Math.abs(value.quantity)
        : Math.abs(value.quantity)

      await adjustStock.mutateAsync({
        productId: product.id,
        type: value.type,
        quantityChange: finalQuantityChange,
        customerId:
          (value.type === "SALE" || value.type === "RETURN") && value.customerId
            ? value.customerId
            : undefined,
        paymentStatus: value.type === "SALE" ? value.paymentStatus : "PAID",
        referenceId: value.referenceId,
        notes: value.notes,
      })
    },
  })

  return (
    <form.Subscribe
      selector={(state) => state.values.type}
      children={(type) => {
        const theme = themeMap[type]

        return (
          <>
            <SheetHeader className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2.5 rounded-xl border transition-colors duration-300 shrink-0",
                    theme.accent
                  )}
                >
                  <ArrowRightLeft className="size-5" />
                </div>
                <div className="space-y-0.5 text-left flex-1 min-w-0">
                  <SheetTitle className="text-lg font-extrabold tracking-tight text-foreground truncate">
                    Quick Adjust
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground font-medium truncate">
                    {product.name}
                  </SheetDescription>
                </div>
              </div>

              {/* Visual Stock & Price Metric Cards */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/50 border border-border text-xs">
                <div className="flex flex-col gap-1 text-left min-w-0">
                  <span className="text-muted-foreground font-medium">
                    Available Stock
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-lg font-extrabold text-foreground tracking-tight truncate max-w-full">
                      {product.stockQuantity}
                    </span>
                    <span className="text-muted-foreground font-medium text-xs shrink-0">
                      pcs
                    </span>
                  </div>
                  {product.stockQuantity <= product.lowStockThreshold ? (
                    <span className="text-xs text-warning font-semibold flex items-center gap-1 mt-1 truncate max-w-full">
                      <AlertTriangle className="size-2.5 text-warning animate-pulse shrink-0" />
                      Low Stock Limit ({product.lowStockThreshold})
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium mt-1 truncate max-w-full">
                      Threshold: {product.lowStockThreshold} pcs
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1 border-l border-border pl-4 text-left min-w-0">
                  <span className="text-muted-foreground font-medium">
                    Selling Price
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-lg font-extrabold text-primary-foreground tracking-tight truncate max-w-full">
                      {formatMoney(Number(product.sellingPrice))}
                    </span>
                  </div>
                  {product.sku ? (
                    <span className="text-xs text-muted-foreground font-mono tracking-wider mt-1 bg-background border border-border px-1.5 py-0.5 rounded-md w-fit truncate max-w-full">
                      SKU: {product.sku}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium mt-1 truncate max-w-full">
                      No SKU assigned
                    </span>
                  )}
                </div>
              </div>
            </SheetHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()

                form.handleSubmit()
              }}
            >
              <div className="space-y-5 px-4">
                <div className="space-y-5">
                  {/* Action Type Segmented Grid Selector */}
                  <form.Field
                    name="type"
                    children={(field) => (
                      <div className="space-y-2 text-left">
                        <Label className="text-xs font-semibold text-muted-foreground">
                          Action Type
                        </Label>
                        <div className="grid grid-cols-5 gap-1.5 p-1 bg-muted/50 border border-border rounded-xl">
                          {ACTIONS.map((item) => {
                            const isSelected = field.state.value === item.value
                            const Icon = item.icon

                            return (
                              <button
                                key={item.value}
                                type="button"
                                onClick={() => field.handleChange(item.value)}
                                className={cn(
                                  "flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-center transition-all duration-200 cursor-pointer border select-none outline-hidden",
                                  isSelected
                                    ? cn(
                                        "shadow-sm scale-102",
                                        item.value === "DAMAGE"
                                          ? "bg-destructive/10 text-destructive border-destructive/20"
                                          : "bg-background text-foreground border-border"
                                      )
                                    : "text-muted-foreground border-transparent bg-transparent hover:text-foreground hover:bg-accent"
                                )}
                              >
                                <Icon className="size-4 shrink-0" />
                                <span className="text-[10px] font-bold tracking-tight">
                                  {item.label}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  />

                  {/* Quantity Stepper */}
                  <form.Field
                    name="quantity"
                    children={(field) => {
                      const isInvalid =
                        field.state.meta.isDirty && !field.state.meta.isValid
                      return (
                        <Field data-invalid={isInvalid} className="text-left">
                          <FieldLabel
                            htmlFor={field.name}
                            className="text-xs font-semibold text-muted-foreground"
                          >
                            Adjustment Qty
                          </FieldLabel>
                          <div
                            className={cn(
                              "flex items-center gap-1 bg-muted/30 border border-border rounded-xl p-1 transition-all",
                              theme.focusRing
                            )}
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() =>
                                field.handleChange(
                                  Math.max(
                                    1,
                                    (Number(field.state.value) || 1) - 1
                                  )
                                )
                              }
                              className="size-8 hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg"
                            >
                              <Minus className="size-3.5" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) =>
                                field.handleChange(Number(e.target.value) || 1)
                              }
                              className="h-8 border-0 bg-transparent text-center focus-visible:ring-0 focus-visible:ring-offset-0 text-sm font-semibold tabular-nums w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              aria-invalid={isInvalid}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() =>
                                field.handleChange(
                                  (Number(field.state.value) || 1) + 1
                                )
                              }
                              className="size-8 hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg"
                            >
                              <Plus className="size-3.5" />
                            </Button>
                          </div>
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      )
                    }}
                  />
                </div>

                {/* LIVE STOCK IMPACT PREVIEW CARD */}
                <form.Subscribe
                  selector={(state) => [
                    state.values.type,
                    state.values.quantity,
                  ]}
                  children={([subType, quantity]) => {
                    const qty = Number(quantity) || 0
                    const isNegative =
                      subType === "SALE" || subType === "DAMAGE"
                    const delta = isNegative ? -qty : qty
                    const newQuantity = Math.max(
                      0,
                      product.stockQuantity + delta
                    )

                    return (
                      <div className="flex items-center justify-between p-3.5 rounded-xl border border-dashed border-border bg-muted/30 text-xs">
                        <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                          <span className="relative flex h-2 w-2">
                            <span
                              className={cn(
                                "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                                subType === "SALE" || subType === "DAMAGE"
                                  ? "bg-destructive/60"
                                  : "bg-primary/60"
                              )}
                            ></span>
                            <span
                              className={cn(
                                "relative inline-flex rounded-full h-2 w-2",
                                subType === "SALE" || subType === "DAMAGE"
                                  ? "bg-destructive"
                                  : "bg-primary"
                              )}
                            ></span>
                          </span>
                          Stock Impact Preview
                        </span>
                        <div className="flex items-center gap-2 font-medium">
                          <span className="text-muted-foreground line-through">
                            {product.stockQuantity}
                          </span>
                          <ArrowRight className="size-3 text-muted-foreground" />
                          <span
                            className={cn(
                              "font-bold text-sm",
                              delta < 0
                                ? "text-destructive"
                                : "text-primary-foreground"
                            )}
                          >
                            {newQuantity} pcs
                          </span>
                          <span
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                              theme.previewBg
                            )}
                          >
                            {delta < 0 ? `-${qty}` : `+${qty}`}
                          </span>
                        </div>
                      </div>
                    )
                  }}
                />

                {/* DYNAMIC SECTION: Only show if it's a SALE or RETURN */}
                {(type === "SALE" || type === "RETURN") && (
                  <div className="space-y-4 text-left transition-all duration-300">
                    <div className="grid grid-cols-1 gap-4">
                      <form.Field
                        name="customerId"
                        children={(field) => {
                          const isInvalid =
                            field.state.meta.isDirty &&
                            !field.state.meta.isValid

                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel
                                htmlFor={field.name}
                                className="text-xs font-semibold text-muted-foreground"
                              >
                                Customer
                              </FieldLabel>
                              <CustomerCombobox
                                id={field.name}
                                value={field.state.value || null}
                                onValueChange={(val) => field.handleChange(val)}
                                placeholder="Walk-in Customer (Guest)"
                              />
                              {isInvalid && (
                                <FieldError errors={field.state.meta.errors} />
                              )}
                            </Field>
                          )
                        }}
                      />

                      {/* Second slot: Payment Status for Sales, Receipt No for Returns */}
                      {type === "SALE" ? (
                        <form.Field
                          name="paymentStatus"
                          children={(field) => {
                            const isInvalid =
                              field.state.meta.isDirty &&
                              !field.state.meta.isValid
                            return (
                              <Field data-invalid={isInvalid}>
                                <FieldLabel
                                  htmlFor={field.name}
                                  className="text-xs font-semibold text-muted-foreground"
                                >
                                  Payment Status
                                </FieldLabel>
                                <Select
                                  id={field.name}
                                  name={field.name}
                                  onValueChange={(val) => {
                                    if (val) field.handleChange(val)
                                  }}
                                  value={field.state.value}
                                >
                                  <SelectTrigger
                                    className={cn(
                                      "bg-background border-border text-sm transition-all rounded-lg h-9!",
                                      theme.focusRing
                                    )}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-popover border-border text-popover-foreground rounded-lg shadow-xl">
                                    <SelectItem
                                      value="PAID"
                                      className="cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2 py-0.5">
                                        <div className="size-1.5 rounded-full bg-success" />
                                        <span>Paid in Full</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem
                                      value="UNPAID"
                                      className="cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2 py-0.5">
                                        <div className="size-1.5 rounded-full bg-warning" />
                                        <span>Add to Udhar (Unpaid)</span>
                                      </div>
                                    </SelectItem>
                                    <SelectItem
                                      value="PARTIAL"
                                      className="cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2 py-0.5">
                                        <div className="size-1.5 rounded-full bg-info" />
                                        <span>Partial Payment</span>
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                {isInvalid && (
                                  <FieldError
                                    errors={field.state.meta.errors}
                                  />
                                )}
                              </Field>
                            )
                          }}
                        />
                      ) : (
                        <form.Field
                          name="referenceId"
                          children={(field) => {
                            const isInvalid =
                              field.state.meta.isDirty &&
                              !field.state.meta.isValid
                            return (
                              <Field data-invalid={isInvalid}>
                                <FieldLabel
                                  htmlFor={field.name}
                                  className="text-xs font-semibold text-muted-foreground"
                                >
                                  Receipt No. (Optional)
                                </FieldLabel>
                                <Input
                                  id={field.name}
                                  name={field.name}
                                  value={field.state.value}
                                  onChange={(e) =>
                                    field.handleChange(e.target.value)
                                  }
                                  placeholder="e.g. RET-1042"
                                  className={cn(
                                    "bg-background border-border text-sm placeholder:text-muted-foreground rounded-lg h-9",
                                    theme.focusRing
                                  )}
                                />
                                {isInvalid && (
                                  <FieldError
                                    errors={field.state.meta.errors}
                                  />
                                )}
                              </Field>
                            )
                          }}
                        />
                      )}
                    </div>

                    {/* Receipt No Field for Sales (shown below Customer/Payment) */}
                    {type === "SALE" && (
                      <form.Field
                        name="referenceId"
                        children={(field) => {
                          const isInvalid =
                            field.state.meta.isDirty &&
                            !field.state.meta.isValid
                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel
                                htmlFor={field.name}
                                className="text-xs font-semibold text-muted-foreground"
                              >
                                Receipt / Invoice No. (Optional)
                              </FieldLabel>
                              <Input
                                id={field.name}
                                name={field.name}
                                value={field.state.value}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                placeholder="e.g. INV-2026-042"
                                className={cn(
                                  "bg-background border-border text-sm placeholder:text-muted-foreground rounded-lg h-9",
                                  theme.focusRing
                                )}
                              />
                              {isInvalid && (
                                <FieldError errors={field.state.meta.errors} />
                              )}
                            </Field>
                          )
                        }}
                      />
                    )}
                  </div>
                )}

                {/* Notes */}
                <form.Field
                  name="notes"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isDirty && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid} className="text-left">
                        <FieldLabel htmlFor={field.name}>
                          Notes (Optional)
                        </FieldLabel>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className={cn("resize-none text-sm", theme.focusRing)}
                          placeholder="Add any internal transaction notes..."
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />
              </div>
              <SheetFooter>
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                  children={([canSubmit, isSubmitting]) => (
                    <Button
                      type="submit"
                      disabled={!canSubmit || isSubmitting}
                      className={cn("w-full", theme.button)}
                    >
                      {isSubmitting ? <Spinner /> : <ArrowRightLeft />}
                      {isSubmitting ? "Recording..." : `Record ${theme.label}`}
                    </Button>
                  )}
                />
              </SheetFooter>
            </form>
          </>
        )
      }}
    />
  )
}

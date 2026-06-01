import { useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, History, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
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
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  )
  const [notes, setNotes] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "UPI">(
    "CASH"
  )

  const [items, setItems] = useState<Array<LineItem>>([
    { id: crypto.randomUUID(), productId: null, quantity: 1 },
  ])

  const { data: products = [] } = useQuery(trpc.product.list.queryOptions())
  const { data: recentSales = [], isLoading: isLoadingRecentSales } = useQuery(
    trpc.transaction.getRecentSales.queryOptions()
  )

  const createSale = useMutation(
    trpc.transaction.createSale.mutationOptions({
      onSuccess: () => {
        toast.success("Sale completed successfully!")
        setItems([{ id: crypto.randomUUID(), productId: null, quantity: 1 }])
        setSelectedCustomerId(null)
        setNotes("")
        setPaymentMethod("CASH")
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

  const addLineItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), productId: null, quantity: 1 },
    ])
  }

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }

  const removeLineItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  // Derived values
  const validItems = items.filter((item) => item.productId !== null)

  const cartTotal = useMemo(() => {
    return validItems.reduce((total, item) => {
      const product = products.find((p) => p.id === item.productId)
      if (!product) return total
      return total + Number(product.sellingPrice) * item.quantity
    }, 0)
  }, [validItems, products])

  const handleCheckout = () => {
    if (validItems.length === 0) {
      toast.error("Please add at least one valid product.")
      return
    }

    createSale.mutate({
      customerId: selectedCustomerId || undefined,
      items: validItems.map((item) => ({
        productId: item.productId as string,
        quantity: item.quantity,
      })),
      paymentStatus: "PAID",
      paymentMethod,
      notes,
    })
  }

  return (
    <div className="max-w-4xl flex flex-col gap-6 pb-12">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-heading font-semibold">New Sale</h2>
        <p className="text-muted-foreground text-sm">
          Build a new invoice to record a direct transaction.
        </p>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <CardContent className="space-y-6">
          <Field className="max-w-md">
            <FieldLabel htmlFor="pos-customer-combobox">
              Select Customer
            </FieldLabel>
            <CustomerCombobox
              id="pos-customer-combobox"
              value={selectedCustomerId}
              onValueChange={setSelectedCustomerId}
              placeholder="Walk-in Customer (Guest)"
            />
          </Field>
          <Field>
            <FieldLabel>Line Items</FieldLabel>
            <div className="flex flex-col gap-4">
              {items.map((item, index) => (
                <LineItemRow
                  key={item.id}
                  index={index}
                  item={item}
                  products={products}
                  onUpdate={(updates) => updateLineItem(item.id, updates)}
                  onRemove={() => removeLineItem(item.id)}
                />
              ))}
              {items.length > 0 && (
                <Button
                  variant="outline"
                  onClick={addLineItem}
                  className="ml-10 w-fit"
                >
                  <Plus />
                  Add Item
                </Button>
              )}
              {items.length === 0 && (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <ShoppingBag className="size-8 opacity-50 mb-2" />
                  <p>No items added to invoice.</p>
                  <Button
                    variant="outline"
                    onClick={addLineItem}
                    className="mt-2"
                  >
                    Add an item
                  </Button>
                </div>
              )}
            </div>
          </Field>
          {/* Notes & Payment Method Section */}
          <Field>
            <FieldLabel>Payment Method</FieldLabel>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(val) => setPaymentMethod(val)}
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
          <Field>
            <FieldLabel htmlFor="transaction-notes">
              Transaction Notes
            </FieldLabel>
            <Textarea
              id="transaction-notes"
              placeholder="Any additional info..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20 max-w-md"
            />
          </Field>

          {/* Total & Checkout Section */}
          <div className="w-full max-w-md flex flex-col gap-2 items-end">
            <div className="flex justify-between items-baseline w-full">
              <span className="font-medium font-heading text-lg">Total</span>
              <span className="font-bold text-2xl tabular-nums">
                {formatMoney(cartTotal)}
              </span>
            </div>
            <Button
              size="lg"
              className="w-full mt-2 font-medium"
              onClick={handleCheckout}
              disabled={validItems.length === 0 || createSale.isPending}
            >
              {createSale.isPending ? (
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
          </div>
        </CardContent>
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

        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}

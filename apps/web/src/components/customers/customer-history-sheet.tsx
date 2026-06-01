import { useQuery } from "@tanstack/react-query"
import { Banknote, ReceiptText, ShoppingBag } from "lucide-react"
import { format } from "date-fns"
import type { Customer } from "@/types/customer"
import { trpc } from "@/lib/trpc"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { formatMoney } from "@/lib/utils"

type CustomerHistorySheetProps = {
  customer: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomerHistorySheet({
  customer,
  open,
  onOpenChange,
}: CustomerHistorySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:sm:max-w-lg">
        {customer ? <CustomerHistorySheetImpl customer={customer} /> : null}
      </SheetContent>
    </Sheet>
  )
}

function CustomerHistorySheetImpl({ customer }: { customer: Customer }) {
  const { data: history, isLoading } = useQuery(
    trpc.customer.getHistory.queryOptions({ customerId: customer.id })
  )

  return (
    <>
      <SheetHeader className="md:gap-1">
        <SheetTitle className="text-lg">Transaction History</SheetTitle>
        <SheetDescription>
          {customer.name}'s complete ledger of purchases and payments.
        </SheetDescription>
      </SheetHeader>

      <div className="px-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : history?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No transactions found for this customer.
          </div>
        ) : (
          <div className="relative pl-6 ml-4 border-l-2 border-transparent space-y-6 py-2 before:absolute before:inset-y-0 before:left-[-2px] before:w-[2px] before:bg-linear-to-b before:from-transparent before:via-muted/90 before:to-transparent">
            {history?.map((tx) => {
              const isPayment = tx.type === "PAYMENT"
              const isUnpaid = tx.paymentStatus === "UNPAID"
              const amount = parseFloat(tx.totalAmount)

              return (
                <div key={tx.id} className="relative group">
                  {/* Timeline Indicator */}
                  <span
                    className={`absolute left-[-38px] flex items-center justify-center w-7 h-7 rounded-full ring-4 ring-background shadow-sm transition-transform group-hover:scale-110 ${
                      isPayment
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {isPayment ? (
                      <Banknote className="h-3.5 w-3.5" />
                    ) : (
                      <ShoppingBag className="h-3.5 w-3.5" />
                    )}
                  </span>

                  {/* Content Box */}
                  <div className="flex flex-col gap-3 p-4 rounded-xl bg-card border shadow-sm transition-all hover:shadow-md hover:border-border/80">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm tracking-tight">
                            {isPayment ? "Payment Received" : "Purchase"}
                          </h4>
                          {!isPayment && isUnpaid && (
                            <Badge
                              variant="destructive"
                              className="h-5 px-1.5 text-[10px] uppercase font-bold tracking-wider"
                            >
                              Udhar
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(tx.createdAt),
                            "MMM d, yyyy • h:mm a"
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold tabular-nums`}>
                          {isPayment ? "+" : ""}
                          {formatMoney(amount)}
                        </p>
                        {!isPayment && tx.paymentMethod && (
                          <p className="text-[10px] text-muted-foreground uppercase font-medium mt-1">
                            {tx.paymentMethod}
                          </p>
                        )}
                      </div>
                    </div>

                    {tx.referenceId && (
                      <div>
                        <Badge variant="secondary">
                          <ReceiptText />
                          {tx.referenceId}
                        </Badge>
                      </div>
                    )}

                    {/* Items List */}
                    {!isPayment && tx.items && tx.items.length > 0 && (
                      <div className="mt-1 pt-3 border-t border-dashed">
                        <ul className="text-sm space-y-2">
                          {tx.items.map((item, idx) => {
                            const itemTotal =
                              parseFloat(item.unitPrice) *
                              Math.abs(item.quantity)
                            return (
                              <li
                                key={idx}
                                className="flex justify-between items-center"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="flex items-center justify-center w-5 h-5 rounded bg-muted text-[11px] font-medium tabular-nums text-muted-foreground">
                                    {Math.abs(item.quantity)}x
                                  </span>
                                  <span className="text-foreground font-medium text-sm">
                                    {item.productName}
                                  </span>
                                </div>
                                <span className="tabular-nums text-muted-foreground text-sm">
                                  {formatMoney(itemTotal)}
                                </span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

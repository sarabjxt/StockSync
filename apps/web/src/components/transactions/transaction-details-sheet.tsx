import { format } from "date-fns"
import { Banknote, ShoppingBag, User } from "lucide-react"
import type { trpc } from "@/lib/trpc"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { formatMoney } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Transaction =
  (typeof trpc.transaction.list)["~types"]["output"]["transactions"][number]

type TransactionDetailsSheetProps = {
  transaction: Transaction
  render?: React.ComponentProps<typeof SheetTrigger>["render"]
}

export function TransactionDetailsSheet({
  transaction,
  render,
}: TransactionDetailsSheetProps) {
  const isPayment = transaction.type === "PAYMENT"
  const amount = parseFloat(transaction.totalAmount || "0")
  const profit = transaction.profit ? parseFloat(transaction.profit) : 0

  return (
    <Sheet>
      <SheetTrigger
        render={
          render ?? (
            <Button variant="outline" size="sm">
              View Details
            </Button>
          )
        }
      />
      <SheetContent className="data-[side=right]:sm:max-w-md w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg flex items-center gap-2">
            {isPayment ? (
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                <Banknote className="h-4 w-4" />
              </span>
            ) : (
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground">
                <ShoppingBag className="h-4 w-4" />
              </span>
            )}
            Transaction Details
          </SheetTitle>
          <SheetDescription>
            {format(new Date(transaction.createdAt), "MMMM d, yyyy • h:mm a")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4">
          {/* Header Summary Box */}
          <div className="p-4 rounded-xl bg-card border shadow-sm transition-shadow hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
                  Customer
                </p>
                <div className="flex items-center gap-2 text-foreground">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium font-heading">
                    {transaction.customerName || "Guest"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
                  Total Amount
                </p>
                <p
                  className={`font-bold tabular-nums ${isPayment ? "text-primary" : "text-foreground"}`}
                >
                  {isPayment ? "+" : ""}
                  {formatMoney(amount)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-3 border-t border-dashed">
              <Badge variant={isPayment ? "secondary" : "default"}>
                {transaction.type}
              </Badge>
              <Badge
                variant={
                  transaction.paymentStatus === "PAID"
                    ? "success"
                    : transaction.paymentStatus === "UNPAID"
                      ? "destructive"
                      : "secondary"
                }
              >
                {transaction.paymentStatus}
              </Badge>
            </div>
          </div>

          {/* Items List */}
          {!isPayment && transaction.items.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
                <span>Items ({transaction.items.length})</span>
                {profit > 0 && (
                  <span className="text-emerald-500 font-medium normal-case tracking-normal">
                    Profit: {formatMoney(profit)}
                  </span>
                )}
              </h4>
              <div className="space-y-2">
                {transaction.items.map((item, idx) => {
                  const itemTotal =
                    parseFloat(item.unitPrice) * Math.abs(item.quantity)
                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-7 h-7 rounded-md bg-muted text-xs font-semibold text-muted-foreground tabular-nums">
                          {Math.abs(item.quantity)}x
                        </span>
                        <div>
                          <p className="font-medium text-sm text-foreground">
                            {item.productName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatMoney(parseFloat(item.unitPrice))} each
                          </p>
                        </div>
                      </div>
                      <span className="tabular-nums font-semibold text-sm text-foreground">
                        {formatMoney(itemTotal)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

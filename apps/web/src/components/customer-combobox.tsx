import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { handleTrpcError, trpc } from "@/lib/trpc"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { cn, formatMoney } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

type CustomerComboboxProps = {
  value: string | null
  onValueChange: (customerId: string | null) => void
  id?: string
  placeholder?: string
}

export function CustomerCombobox({
  value,
  onValueChange,
  id,
  placeholder = "Walk-in Customer (Guest)",
}: CustomerComboboxProps) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")

  const customerListOptions = trpc.customer.list.queryOptions()

  const createCustomer = useMutation(
    trpc.customer.create.mutationOptions({
      onSuccess: (data) => {
        toast.success("Customer created successfully!")
        // Immediately add to the customers list using the exact query key from queryOptions
        queryClient.setQueryData(customerListOptions.queryKey, (old: any) => {
          return [...(old || []), data.customer]
        })
      },
      onError: (err) => handleTrpcError(err),
    })
  )

  const { data: customers } = useQuery(customerListOptions)

  const exactMatch = customers?.find(
    (c) => c.name.toLowerCase() === searchQuery.trim().toLowerCase()
  )
  const showCreate = searchQuery.trim().length > 0 && !exactMatch

  const customerItems =
    customers?.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email || "",
      phone: c.phone || "",
      storeCredit: c.storeCredit,
    })) || []

  if (showCreate) {
    customerItems.push({
      id: "CREATE_NEW",
      name: `Create "${searchQuery.trim()}"`,
      email: "",
      phone: "",
      storeCredit: "0.00",
    })
  }

  const currentCustomerId = value
  const selectedCustomer = currentCustomerId
    ? customerItems.find((item) => item.id === currentCustomerId) || null
    : null

  return (
    <Combobox
      autoHighlight
      items={customerItems}
      value={selectedCustomer}
      inputValue={searchQuery}
      onInputValueChange={setSearchQuery}
      disabled={createCustomer.isPending}
      onValueChange={async (val) => {
        if (val?.id === "CREATE_NEW") {
          const newCustomerName = searchQuery.trim()

          const res = await createCustomer.mutateAsync({
            name: newCustomerName,
          })
          onValueChange(res.customer.id)
          setSearchQuery(res.customer.name)
        } else {
          onValueChange(val?.id || null)
          if (!val) {
            setSearchQuery("")
          }
        }
      }}
      itemToStringLabel={(item) =>
        item.id === "CREATE_NEW" ? searchQuery.trim() : item.name
      }
    >
      <ComboboxInput id={id} placeholder={placeholder} className="w-full h-9" />
      <ComboboxContent className="bg-popover border-border text-popover-foreground shadow-xl rounded-lg overflow-hidden max-h-[250px]">
        <ComboboxEmpty className="p-3 text-xs text-muted-foreground text-center">
          No customers found.
        </ComboboxEmpty>
        <ComboboxList className="p-1 max-h-[240px] overflow-y-auto">
          {(item) => {
            const isCreate = item.id === "CREATE_NEW"
            const initials = isCreate ? "" : getInitials(item.name)
            const creditNum = Number(item.storeCredit) || 0

            return (
              <ComboboxItem
                key={item.id}
                value={item}
                className="hover:bg-accent data-highlighted:bg-accent text-xs py-2 px-3 rounded-md cursor-pointer transition-colors flex items-center justify-between gap-3 border border-transparent"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "size-7 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0",
                      isCreate
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted border-border text-foreground"
                    )}
                  >
                    {isCreate &&
                      (createCustomer.isPending ? (
                        <Spinner className="size-4" />
                      ) : (
                        <Plus className="size-4" />
                      ))}
                    {initials}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-foreground">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {isCreate
                        ? "Click to add new customer"
                        : item.phone || item.email || "No contact info"}
                    </span>
                  </div>
                  {!isCreate && creditNum !== 0 && (
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-semibold tabular-nums ml-1 shrink-0 border",
                        creditNum > 0
                          ? "bg-primary/10 text-primary-foreground! border-primary/20"
                          : "bg-warning/10 text-warning! border-warning/20"
                      )}
                    >
                      {creditNum > 0
                        ? `Credit: ${formatMoney(creditNum)}`
                        : `Owes: ${formatMoney(Math.abs(creditNum))}`}
                    </span>
                  )}
                </div>
              </ComboboxItem>
            )
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

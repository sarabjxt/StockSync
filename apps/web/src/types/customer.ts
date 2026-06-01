import type { trpc } from "@/lib/trpc"

export type Customers = (typeof trpc.customer.list)["~types"]["output"]
export type Customer = Customers[number]

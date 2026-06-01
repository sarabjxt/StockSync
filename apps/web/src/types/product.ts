import type { trpc } from "@/lib/trpc"

export type Products = (typeof trpc.product.list)["~types"]["output"]
export type Product = Products[number]
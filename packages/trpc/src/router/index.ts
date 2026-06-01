import { router } from "../trpc"
import { authRouter } from "./auth"
import { categoryRouter } from "./category"
import { productRouter } from "./product"
import { customerRouter } from "./customer"
import { analyticsRouter } from "./analytics"
import { transactionRouter } from "./transaction"

export const appRouter = router({
  auth: authRouter,
  category: categoryRouter,
  product: productRouter,
  customer: customerRouter,
  analytics: analyticsRouter,
  transaction: transactionRouter,
})

export type AppRouter = typeof appRouter

import { eq, desc, count, sql, inArray } from "drizzle-orm"
import z from "zod"
import { transaction, transactionItem, product, customer } from "@stocksync/db"
import { router, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"

const createSaleSchema = z.object({
  customerId: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  paymentStatus: z.enum(["PAID", "UNPAID", "PARTIAL"]).default("PAID"),
  amountPaid: z.number().nonnegative().optional(),
  paymentMethod: z.enum(["CASH", "CARD", "UPI"]).optional(),
  notes: z.string().optional(),
  referenceId: z.string().optional(),
})

export const transactionRouter = router({
  createSale: protectedProcedure
    .input(createSaleSchema)
    .mutation(async ({ ctx, input }) => {
      const productIds = input.items.map((i) => i.productId)
      const products = await ctx.db.query.product.findMany({
        where: inArray(product.id, productIds),
      })

      if (products.length !== productIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more products not found",
        })
      }

      let totalAmount = 0
      let totalProfit = 0

      const itemsWithPrices = input.items.map((item) => {
        const prod = products.find((p) => p.id === item.productId)!
        const sellingPrice = parseFloat(prod.sellingPrice)
        const costPrice = parseFloat(prod.costPrice)

        totalAmount += sellingPrice * item.quantity
        totalProfit += (sellingPrice - costPrice) * item.quantity

        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: sellingPrice.toString(),
        }
      })

      // Backend Validations for Payment Statuses
      if (input.paymentStatus === "PARTIAL") {
        if (input.amountPaid === undefined) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Amount paid is required for partial payments.",
          })
        }
        if (input.amountPaid >= totalAmount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Amount paid for a partial payment must be less than the total sale amount.",
          })
        }
      }

      if ((input.paymentStatus === "UNPAID" || input.paymentStatus === "PARTIAL") && !input.customerId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A customer must be selected to record an unpaid or partial sale.",
        })
      }

      await ctx.db.transaction(async (tx) => {
        // Create Transaction
        const [newTx] = await tx
          .insert(transaction)
          .values({
            userId: ctx.user.id,
            customerId: input.customerId,
            type: "SALE",
            totalAmount: totalAmount.toString(),
            profit: totalProfit.toString(),
            amountPaid: input.amountPaid !== undefined
              ? input.amountPaid.toString()
              : (input.paymentStatus === "PAID" ? totalAmount.toString() : "0.00"),
            paymentStatus: input.paymentStatus,
            paymentMethod: input.paymentMethod,
            notes: input.notes,
            referenceId: input.referenceId,
          })
          .returning()

        if (!newTx)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create transaction",
          })

        // Create Transaction Items
        await tx.insert(transactionItem).values(
          itemsWithPrices.map((item) => ({
            transactionId: newTx.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }))
        )

        // Update Product Stock
        for (const item of input.items) {
          await tx
            .update(product)
            .set({
              stockQuantity: sql`${product.stockQuantity} - ${item.quantity}`,
              updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(product.id, item.productId))
        }

        // Update Customer Credit if unpaid or partial
        if (input.customerId && (input.paymentStatus === "UNPAID" || input.paymentStatus === "PARTIAL")) {
          const debtAmount = input.paymentStatus === "UNPAID"
            ? totalAmount
            : totalAmount - (input.amountPaid || 0);

          await tx
            .update(customer)
            .set({
              storeCredit: sql`${customer.storeCredit} - ${debtAmount}`,
              updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(customer.id, input.customerId))
        }
      })

      return { success: true }
    }),

  list: protectedProcedure
    .input(
      z
        .object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(10),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page || 1
      const limit = input?.limit || 10
      const offset = (page - 1) * limit

      const baseWhere = eq(transaction.userId, ctx.user.id)

      const txs = await ctx.db
        .select({
          id: transaction.id,
          type: transaction.type,
          totalAmount: transaction.totalAmount,
          profit: transaction.profit,
          paymentStatus: transaction.paymentStatus,
          createdAt: transaction.createdAt,
          customerName: customer.name,
        })
        .from(transaction)
        .leftJoin(customer, eq(transaction.customerId, customer.id))
        .where(baseWhere)
        .orderBy(desc(transaction.createdAt))
        .limit(limit)
        .offset(offset)

      // Fetch items for these transactions
      const txIds = txs.map((t) => t.id)

      let allItems: any[] = []
      if (txIds.length > 0) {
        allItems = await ctx.db.query.transactionItem.findMany({
          where: inArray(transactionItem.transactionId, txIds),
          with: {
            product: true,
          },
        })
      }

      const transactions = txs.map((t) => {
        const tItems = allItems.filter((i) => i.transactionId === t.id)
        return {
          ...t,
          items: tItems.map((i) => ({
            productName: i.product?.name || "Unknown Product",
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }
      })

      const countResult = await ctx.db
        .select({
          total: count(transaction.id),
        })
        .from(transaction)
        .where(baseWhere)

      const totalCount = countResult[0]?.total ?? 0

      return {
        transactions,
        totalCount,
        pageCount: Math.ceil(totalCount / limit),
      }
    }),

  getRecentSales: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const txs = await ctx.db
      .select({
        id: transaction.id,
        totalAmount: transaction.totalAmount,
        paymentStatus: transaction.paymentStatus,
        paymentMethod: transaction.paymentMethod,
        createdAt: transaction.createdAt,
        customerName: customer.name,
      })
      .from(transaction)
      .leftJoin(customer, eq(transaction.customerId, customer.id))
      .where(
        sql`${transaction.userId} = ${ctx.user.id} AND ${transaction.type} = 'SALE' AND ${transaction.createdAt} >= ${today.toISOString()}`
      )
      .orderBy(desc(transaction.createdAt))
      .limit(5)

    return txs
  }),
})

import { z } from "zod"
import { and, desc, eq, inArray, sql } from "drizzle-orm"
import { transaction, transactionItem, customer, product } from "@stocksync/db"
import { router, protectedProcedure } from "../trpc"

const createCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required").max(255),
  phone: z.string().max(20, "Phone number is too long").optional(),
  email: z.email("Invalid email").optional(),
  notes: z.string().optional(),
})

const updateCustomerSchema = createCustomerSchema.partial().extend({
  id: z.uuid().min(1, "Customer ID is required"),
})

const deleteCustomerSchema = z.object({
  id: z.uuid().min(1, "Customer ID is required"),
})

const processPaymentSchema = z.object({
  customerId: z.uuid(),
  amount: z.number().positive("Payment must be greater than 0"),
  notes: z.string().optional(),
})

export const customerRouter = router({
  create: protectedProcedure
    .input(createCustomerSchema)
    .mutation(async ({ ctx, input }) => {
      const [newCustomer] = await ctx.db
        .insert(customer)
        .values({
          userId: ctx.user.id,
          name: input.name,
          phone: input.phone,
          email: input.email,
          notes: input.notes,
        })
        .returning()

      return {
        success: true,
        customer: newCustomer,
      }
    }),

  update: protectedProcedure
    .input(updateCustomerSchema)
    .mutation(async ({ ctx, input }) => {
      const [updatedCustomer] = await ctx.db
        .update(customer)
        .set({
          name: input.name,
          phone: input.phone,
          email: input.email,
          notes: input.notes,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(customer.id, input.id))
        .returning()

      return {
        success: true,
        customer: updatedCustomer,
      }
    }),

  delete: protectedProcedure
    .input(deleteCustomerSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(customer)
        .set({
          isArchived: true,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(customer.id, input.id))

      return { success: true }
    }),

  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.customer.findMany({
      where: and(
        eq(customer.userId, ctx.user.id),
        eq(customer.isArchived, false)
      ),
    })
  }),

  processPayment: protectedProcedure
    .input(processPaymentSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        // Record the payment in the ledger
        await tx.insert(transaction).values({
          userId: ctx.user.id,
          customerId: input.customerId,
          type: "PAYMENT",
          totalAmount: input.amount.toString(),
          paymentStatus: "PAID",
          notes: input.notes || "Account Payment",
        })

        // Increase the customer's store credit (moving their negative balance back toward zero)
        await tx
          .update(customer)
          .set({
            storeCredit: sql`${customer.storeCredit} + ${input.amount}`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(customer.id, input.customerId))
      })

      return { success: true }
    }),

  getHistory: protectedProcedure
    .input(z.object({ customerId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      const txs = await ctx.db
        .select({
          id: transaction.id,
          type: transaction.type,
          totalAmount: transaction.totalAmount,
          paymentStatus: transaction.paymentStatus,
          paymentMethod: transaction.paymentMethod,
          referenceId: transaction.referenceId,
          createdAt: transaction.createdAt,
        })
        .from(transaction)
        .where(eq(transaction.customerId, input.customerId))
        .orderBy(desc(transaction.createdAt))

      const txItems = await ctx.db.query.transactionItem.findMany({
        where: inArray(
          transactionItem.transactionId,
          txs.map((t) => t.id)
        ),
        with: {
          product: true,
        },
      })

      return txs.map((t) => {
        const tItems = txItems.filter((i) => i.transactionId === t.id)
        return {
          ...t,
          items: tItems.map((i) => ({
            productName: i.product.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }
      })
    }),
})

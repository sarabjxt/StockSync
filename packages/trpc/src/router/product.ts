import { z } from "zod"
import {
  category,
  customer,
  DB_CONSTRAINTS,
  product,
  transaction,
  transactionItem,
} from "@stocksync/db"
import { and, desc, eq, sql } from "drizzle-orm"
import { TRPCError } from "@trpc/server"
import { PostgresError } from "postgres"
import { router, protectedProcedure } from "../trpc"

const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255),
  sku: z.string().max(100).optional(),
  categoryId: z.uuid("Invalid category ID").optional().nullable(),
  imageUrl: z
    .url("Must be a valid URL")
    .optional()
    .nullable()
    .or(z.literal("")),

  costPrice: z.number().positive("Cost price must be greater than 0"),
  sellingPrice: z.number().positive("Selling price must be greater than 0"),

  stockQuantity: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().nonnegative().default(5),
})

const updateProductSchema = createProductSchema.partial().extend({
  id: z.uuid().min(1, "Product ID is required"),
})

const deleteProductSchema = z.object({
  id: z.uuid().min(1, "Product ID is required"),
})

const adjustStockSchema = z.object({
  productId: z.uuid(),
  customerId: z.uuid().optional(),
  quantityChange: z.number().int(),
  type: z.enum(["SALE", "RESTOCK", "DAMAGE", "RETURN", "MANUAL_CORRECTION"]),
  paymentStatus: z.enum(["PAID", "UNPAID", "PARTIAL"]).default("PAID"),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
})

export const productRouter = router({
  create: protectedProcedure
    .input(createProductSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const [newProduct] = await ctx.db
          .insert(product)
          .values({
            userId: ctx.user.id,
            name: input.name,
            sku: input.sku || null,
            categoryId: input.categoryId,
            imageUrl: input.imageUrl,
            costPrice: input.costPrice.toString(),
            sellingPrice: input.sellingPrice.toString(),
            stockQuantity: input.stockQuantity,
            lowStockThreshold: input.lowStockThreshold,
          })
          .returning()

        return {
          success: true,
          product: newProduct,
        }
      } catch (error) {
        // Note: 23505 is postgres unique constraint violation code
        if (error instanceof PostgresError && error.code === "23505") {
          const isSkuConflict =
            error.constraint_name === DB_CONSTRAINTS.product.userSkuUniq
          if (isSkuConflict) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "A product with this SKU already exists",
            })
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create product",
          cause: error,
        })
      }
    }),

  update: protectedProcedure
    .input(updateProductSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const [updatedProduct] = await ctx.db
          .update(product)
          .set({
            ...input,
            sku: input.sku || null,
            costPrice: input.costPrice?.toString(),
            sellingPrice: input.sellingPrice?.toString(),
          })
          .where(eq(product.id, input.id))
          .returning()

        return {
          success: true,
          product: updatedProduct,
        }
      } catch (error) {
        // Note: 23505 is postgres unique constraint violation code
        if (error instanceof PostgresError && error.code === "23505") {
          const isSkuConflict =
            error.constraint_name === DB_CONSTRAINTS.product.userSkuUniq
          if (isSkuConflict) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "A product with this SKU already exists",
            })
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update product",
          cause: error,
        })
      }
    }),

  delete: protectedProcedure
    .input(deleteProductSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(product)
        .set({
          isArchived: true,
        })
        .where(eq(product.id, input.id))

      return {
        success: true,
      }
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select({
        id: product.id,
        name: product.name,
        sku: product.sku,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        stockQuantity: product.stockQuantity,
        lowStockThreshold: product.lowStockThreshold,
        imageUrl: product.imageUrl,
        category: {
          id: category.id,
          name: category.name,
        },
      })
      .from(product)
      .leftJoin(category, eq(product.categoryId, category.id))
      .where(
        and(eq(product.userId, ctx.user.id), eq(product.isArchived, false))
      )
      .orderBy(desc(product.createdAt))
  }),

  adjustStock: protectedProcedure
    .input(adjustStockSchema)
    .mutation(async ({ ctx, input }) => {
      const [existingProduct] = await ctx.db
        .select({
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
        })
        .from(product)
        .where(eq(product.id, input.productId))

      if (!existingProduct)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        })

      const absoluteQuantity = Math.abs(input.quantityChange)
      let calculatedTotal = 0
      let calculatedProfit = 0

      if (input.type === "SALE" || input.type === "RETURN") {
        calculatedTotal =
          absoluteQuantity * parseFloat(existingProduct.sellingPrice)
        calculatedProfit =
          (parseFloat(existingProduct.sellingPrice) -
            parseFloat(existingProduct.costPrice)) *
          absoluteQuantity
      } else {
        calculatedTotal =
          absoluteQuantity * parseFloat(existingProduct.costPrice)
      }

      await ctx.db.transaction(async (tx) => {
        const [newTx] = await tx
          .insert(transaction)
          .values({
            userId: ctx.user.id,
            customerId: input.customerId,
            type: input.type,
            totalAmount: calculatedTotal.toString(),
            profit: calculatedProfit.toString(),
            paymentStatus: input.paymentStatus,
            referenceId: input.referenceId,
            notes: input.notes,
          })
          .returning()

        if (!newTx) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create transaction record",
          })
        }

        await tx.insert(transactionItem).values({
          transactionId: newTx.id,
          productId: input.productId,
          quantity: input.quantityChange,
          unitPrice:
            input.type === "SALE" || input.type === "RETURN"
              ? existingProduct.sellingPrice
              : existingProduct.costPrice,
        })
        await tx
          .update(product)
          .set({
            stockQuantity: sql`${product.stockQuantity} + ${input.quantityChange}`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(product.id, input.productId))

        // If it's an UNPAID sale to a specific customer, decrease their store credit
        if (
          input.type === "SALE" &&
          input.paymentStatus === "UNPAID" &&
          input.customerId
        ) {
          await tx
            .update(customer)
            .set({
              storeCredit: sql`${customer.storeCredit} - ${calculatedTotal}`,
              updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(customer.id, input.customerId))
        }
      })

      return { success: true }
    }),
})

import { z } from "zod"
import { eq } from "drizzle-orm"
import { db, DB_CONSTRAINTS } from "@stocksync/db"
import { category } from "@stocksync/db"
import { TRPCError } from "@trpc/server"
import { PostgresError } from "postgres"
import { router, protectedProcedure } from "../trpc"

export const categoryRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select({
        id: category.id,
        name: category.name,
      })
      .from(category)
      .where(eq(category.userId, ctx.user.id))
      .orderBy(category.name)
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1, "Name is required").max(100) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const [newCategory] = await db
          .insert(category)
          .values({
            userId: ctx.user.id,
            name: input.name.trim(),
          })
          .returning()

        return { success: true, category: newCategory }
      } catch (error) {
        // Note: 23505 is postgres unique constraint violation code
        if (error instanceof PostgresError && error.code === "23505") {
          const isSkuConflict =
            error.constraint_name === DB_CONSTRAINTS.category.userNameUniq

          if (isSkuConflict) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Category already exists",
            })
          }
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create category",
          cause: error,
        })
      }
    }),
})

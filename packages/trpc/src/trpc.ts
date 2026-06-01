import { initTRPC, TRPCError } from "@trpc/server"

import { type Context } from "./context"
import z, { ZodError } from "zod"

const t = initTRPC.context<Context>().create({
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError:
        error.cause instanceof ZodError ? z.prettifyError(error.cause) : null,
    },
  }),
})

export const router = t.router

export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in",
    })
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.session.user,
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

import { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify"

import { db } from "@stocksync/db"
import { auth } from "@stocksync/auth/server"
import { fromNodeHeaders } from "better-auth/node"

export async function createContext({ req, res }: CreateFastifyContextOptions) {
  const headers = fromNodeHeaders(req.headers)

  const session = await auth.api.getSession({
    headers,
  })

  return {
    req,
    res,
    db,
    session,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>

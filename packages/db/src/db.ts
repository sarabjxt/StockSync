import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"
import { env } from "./env"

const queryClient = postgres(env.DATABASE_URL, { max: 10 })

export const db = drizzle(queryClient, {
  schema,
  logger: process.env.NODE_ENV !== "production",
})

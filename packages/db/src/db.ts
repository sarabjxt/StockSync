import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"
import { env } from "./env"

// In production, you want to limit connections.
// For local dev, a single connection is fine.
const queryClient = postgres(env.DATABASE_URL, { max: 10 })

export const db = drizzle(queryClient, {
  schema,
  logger: process.env.NODE_ENV !== "production",
})

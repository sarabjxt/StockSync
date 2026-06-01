import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { sql } from "drizzle-orm"
import { env } from "./env"

const connection = postgres(env.DATABASE_URL, { max: 1 })
const db = drizzle(connection)

async function main() {
  console.log("🧨 Dropping all tables and resetting database...")

  try {
    // CASCADE ensures it deletes all tables and their foreign key relationships
    await db.execute(sql`DROP SCHEMA public CASCADE;`)
    await db.execute(sql`CREATE SCHEMA public;`)

    console.log("✅ Database completely reset!")
  } catch (error) {
    console.error("❌ Error resetting database:", error)
  } finally {
    await connection.end()
  }
}

main()

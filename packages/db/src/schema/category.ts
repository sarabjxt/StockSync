import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { user } from "./auth"
import { DB_CONSTRAINTS } from "../constraints"

export const category = pgTable(
  "category",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),

    name: varchar("name", { length: 100 }).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex(DB_CONSTRAINTS.category.userNameUniq).on(t.userId, t.name),
  ]
)

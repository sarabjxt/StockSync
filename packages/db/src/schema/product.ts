import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  integer,
  numeric,
  text,
  boolean,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { user } from "./auth"
import { category } from "./category"
import { DB_CONSTRAINTS } from "../constraints"

export const product = pgTable(
  "product",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),

    name: varchar("name", { length: 255 }).notNull(),
    sku: varchar("sku", { length: 100 }),

    categoryId: uuid("category_id").references(() => category.id, {
      onDelete: "set null",
    }),

    imageUrl: text("image_url"),

    costPrice: numeric("cost_price", { precision: 10, scale: 2 }).notNull(),
    sellingPrice: numeric("selling_price", {
      precision: 10,
      scale: 2,
    }).notNull(),

    stockQuantity: integer("stock_quantity").default(0).notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(5).notNull(),

    isArchived: boolean("is_archived").default(false).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex(DB_CONSTRAINTS.product.userSkuUniq).on(t.userId, t.sku)]
)

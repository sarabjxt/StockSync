import {
  pgTable,
  timestamp,
  uuid,
  integer,
  numeric,
  text,
  varchar,
} from "drizzle-orm/pg-core"
import { user } from "./auth"
import { product } from "./product"
import { customer } from "./customer"

export const transaction = pgTable("transaction", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),

  customerId: uuid("customer_id").references(() => customer.id, {
    onDelete: "set null",
  }),
  referenceId: varchar("reference_id", { length: 255 }), // Invoice or Receipt Number

  type: varchar("type", { length: 50 }).notNull(), // 'SALE', 'RESTOCK', 'DAMAGE', 'RETURN', 'PAYMENT'
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  profit: numeric("profit", { precision: 10, scale: 2 }),

  // Tracks if this specific receipt was paid for or added to Udhar
  paymentStatus: varchar("payment_status", { length: 50 })
    .default("PAID")
    .notNull(), // 'PAID', 'UNPAID', 'PARTIAL'

  paymentMethod: varchar("payment_method", { length: 50 }), // 'CASH', 'CARD', 'UPI'

  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const transactionItem = pgTable("transaction_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id")
    .references(() => transaction.id, { onDelete: "cascade" })
    .notNull(),
  productId: uuid("product_id")
    .references(() => product.id, { onDelete: "restrict" })
    .notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
})

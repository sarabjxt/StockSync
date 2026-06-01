import { relations } from "drizzle-orm"

import { user } from "./auth"
import { product } from "./product"
import { transaction, transactionItem } from "./transaction"

export const usersRelations = relations(user, ({ many }) => ({
  transactions: many(transaction),
}))

export const productsRelations = relations(product, ({ many }) => ({
  transactionItems: many(transactionItem),
}))

export const transactionsRelations = relations(transaction, ({ one, many }) => ({
  user: one(user, {
    fields: [transaction.userId],
    references: [user.id],
  }),
  items: many(transactionItem),
}))

export const transactionItemsRelations = relations(transactionItem, ({ one }) => ({
  transaction: one(transaction, {
    fields: [transactionItem.transactionId],
    references: [transaction.id],
  }),
  product: one(product, {
    fields: [transactionItem.productId],
    references: [product.id],
  }),
}))

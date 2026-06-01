import { eq, and, gte, lt, sql, desc } from "drizzle-orm"
import { startOfDay, endOfDay, subDays, format } from "date-fns"
import { transaction, transactionItem, customer, product, category } from "@stocksync/db"
import { router, protectedProcedure } from "../trpc"

export const analyticsRouter = router({
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date()
    const startOfToday = startOfDay(today)
    const endOfToday = endOfDay(today)
    const thirtyDaysAgo = subDays(startOfToday, 29)

    // 1. Today's Revenue & Profit
    const [todayStats] = await ctx.db
      .select({
        revenue: sql<number>`COALESCE(SUM(CAST(${transaction.totalAmount} AS NUMERIC)), 0)`,
        profit: sql<number>`COALESCE(SUM(CAST(${transaction.profit} AS NUMERIC)), 0)`,
        salesCount: sql<number>`COUNT(*)`,
      })
      .from(transaction)
      .where(
        and(
          eq(transaction.userId, ctx.user.id),
          eq(transaction.type, "SALE"),
          gte(transaction.createdAt, startOfToday),
          lt(transaction.createdAt, endOfToday)
        )
      )

    // 2. Total Outstanding Debt (Udhar)
    const [debtStats] = await ctx.db
      .select({
        totalOwed: sql<number>`COALESCE(SUM(CAST(${customer.storeCredit} AS NUMERIC)), 0)`,
      })
      .from(customer)
      .where(
        and(
          eq(customer.userId, ctx.user.id),
          lt(customer.storeCredit, "0") // Only sum negative balances
        )
      )

    // 3. Chart Data (Last 30 Days of Sales)
    const recentSales = await ctx.db
      .select({
        amount: transaction.totalAmount,
        createdAt: transaction.createdAt,
      })
      .from(transaction)
      .where(
        and(
          eq(transaction.userId, ctx.user.id),
          eq(transaction.type, "SALE"),
          gte(transaction.createdAt, thirtyDaysAgo)
        )
      )

    // Aggregate sales by day for the chart
    const chartDataMap = new Map()
    // Initialize the last 30 days with 0
    for (let i = 29; i >= 0; i--) {
      const dateStr = format(subDays(today, i), "MMM dd")
      chartDataMap.set(dateStr, 0)
    }

    // Fill in actual sales
    recentSales.forEach((sale) => {
      const dateStr = format(new Date(sale.createdAt), "MMM dd")
      const current = chartDataMap.get(dateStr) || 0
      chartDataMap.set(dateStr, current + parseFloat(sale.amount || "0"))
    })

    const chartData30 = Array.from(chartDataMap, ([date, revenue]) => ({
      date,
      revenue,
    }))

    const chartData14 = chartData30.slice(-14)
    const chartData7 = chartData30.slice(-7)

    // Top selling items in the last 30 days
    const topSellingItems = await ctx.db
      .select({
        name: product.name,
        totalAmount: sql<number>`SUM(CAST(${transactionItem.quantity} AS NUMERIC) * CAST(${transactionItem.unitPrice} AS NUMERIC)) AS totalAmount`,
        totalQuantity: sql<number>`SUM(CAST(${transactionItem.quantity} AS NUMERIC)) AS totalQuantity`,
      })
      .from(transaction)
      .innerJoin(transactionItem, eq(transaction.id, transactionItem.transactionId))
      .innerJoin(product, eq(transactionItem.productId, product.id))
      .where(
        and(
          eq(transaction.userId, ctx.user.id),
          eq(transaction.type, "SALE"),
          gte(transaction.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(product.name)
      .orderBy(desc(sql`totalAmount`))
      .limit(10)

    // Top selling items categories in the last 30 days
    const topSellingItemCategories = await ctx.db
      .select({
        name: category.name,
        totalAmount: sql<number>`SUM(CAST(${transactionItem.quantity} AS NUMERIC) * CAST(${transactionItem.unitPrice} AS NUMERIC)) AS totalAmount`,
        totalQuantity: sql<number>`SUM(CAST(${transactionItem.quantity} AS NUMERIC)) AS totalQuantity`,
      })
      .from(transaction)
      .innerJoin(transactionItem, eq(transaction.id, transactionItem.transactionId))
      .innerJoin(product, eq(transactionItem.productId, product.id))
      .innerJoin(category, eq(product.categoryId, category.id))
      .where(
        and(
          eq(transaction.userId, ctx.user.id),
          eq(transaction.type, "SALE"),
          gte(transaction.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(category.name)
      .orderBy(desc(sql`totalAmount`))
      .limit(10)

    return {
      todayRevenue: todayStats?.revenue || 0,
      todayProfit: todayStats?.profit || 0,
      todaySalesCount: todayStats?.salesCount || 0,
      totalDebt: Math.abs(debtStats?.totalOwed || 0),
      chartData7,
      chartData14,
      chartData30,
      topSellingItems,
      topSellingItemCategories,
    }
  }),
})

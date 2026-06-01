import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { env } from "./env"
import * as schema from "./schema"

import { eq } from "drizzle-orm"

// Create a single, short-lived connection just for this script
const connection = postgres(env.DATABASE_URL, { max: 1 })
const db = drizzle(connection, { schema })

async function main() {
  console.log("🌱 Starting database seeding...")

  try {
    const user = await db.query.user.findFirst({
      where: eq(schema.user.email, "amit@stocksync.local"),
    })

    if (!user) {
      console.error("❌ User not found!")
      return
    }

    // 1. Insert Categories
    console.log("📂 Injecting categories...")
    const insertedCategories = await db.insert(schema.category).values([
      { userId: user.id, name: "Processor" },
      { userId: user.id, name: "Graphics Card" },
      { userId: user.id, name: "Storage" },
      { userId: user.id, name: "Peripherals" },
      { userId: user.id, name: "Motherboard" },
    ]).returning()

    const catMap = insertedCategories.reduce((acc, cat) => {
      acc[cat.name] = cat.id
      return acc
    }, {} as Record<string, string>)

    // 2. Insert Realistic Products
    console.log("📦 Injecting products...")
    const insertedProducts = await db.insert(schema.product).values([
      {
        userId: user.id,
        name: "Intel Core i7-13700K",
        sku: "INTEL-I7-13700K",
        categoryId: catMap["Processor"],
        costPrice: "34000.00",
        sellingPrice: "36500.00",
        stockQuantity: 12,
        lowStockThreshold: 3,
      },
      {
        userId: user.id,
        name: "AMD Ryzen 5 7600X",
        sku: "AMD-R5-7600X",
        categoryId: catMap["Processor"],
        costPrice: "19500.00",
        sellingPrice: "21000.00",
        stockQuantity: 15,
        lowStockThreshold: 5,
      },
      {
        userId: user.id,
        name: "NVIDIA RTX 4070 Ti 12GB",
        sku: "NV-RTX-4070TI",
        categoryId: catMap["Graphics Card"],
        costPrice: "72000.00",
        sellingPrice: "78000.00",
        stockQuantity: 4,
        lowStockThreshold: 2,
      },
      {
        userId: user.id,
        name: "Samsung 980 PRO 1TB NVMe M.2",
        sku: "SAM-980PRO-1TB",
        categoryId: catMap["Storage"],
        costPrice: "7800.00",
        sellingPrice: "8500.00",
        stockQuantity: 25,
        lowStockThreshold: 8,
      },
      {
        userId: user.id,
        name: "WD Blue 2TB HDD",
        sku: "WD-BLU-2TB",
        categoryId: catMap["Storage"],
        costPrice: "4200.00",
        sellingPrice: "4800.00",
        stockQuantity: 10,
        lowStockThreshold: 4,
      },
      {
        userId: user.id,
        name: "Logitech G502 Hero Mouse",
        sku: "LOGI-G502-HERO",
        categoryId: catMap["Peripherals"],
        costPrice: "3200.00",
        sellingPrice: "3900.00",
        stockQuantity: 18,
        lowStockThreshold: 5,
      },
      {
        userId: user.id,
        name: "Keychron K2 V2 Mechanical Keyboard",
        sku: "KEYC-K2V2",
        categoryId: catMap["Peripherals"],
        costPrice: "6500.00",
        sellingPrice: "7500.00",
        stockQuantity: 8,
        lowStockThreshold: 3,
      },
      {
        userId: user.id,
        name: "MSI MAG B650 TOMAHAWK WIFI",
        sku: "MSI-B650-TOM",
        categoryId: catMap["Motherboard"],
        costPrice: "19000.00",
        sellingPrice: "21500.00",
        stockQuantity: 6,
        lowStockThreshold: 2,
      },
    ]).returning()

    // 3. Insert Customers
    console.log("👥 Injecting customers...")
    const insertedCustomers = await db.insert(schema.customer).values([
      {
        userId: user.id,
        name: "Rahul Sharma",
        phone: "9876543210",
        email: "rahul.s@example.com",
        storeCredit: "-12000.00", // Owes money
        notes: "Regular customer, runs a gaming cafe.",
      },
      {
        userId: user.id,
        name: "Sneha Gupta",
        phone: "9876543211",
        email: "sneha.g@example.com",
        storeCredit: "0.00",
        notes: "Freelance video editor.",
      },
      {
        userId: user.id,
        name: "TechVision Solutions",
        phone: "9876543212",
        email: "contact@techvision.local",
        storeCredit: "-45000.00", // Large debt
        notes: "Corporate client, 30-day payment cycle.",
      },
    ]).returning()

    // 4. Insert Transactions & Items (Sales with Debt/UNPAID)
    console.log("💳 Injecting transactions...")

    // Rahul's UNPAID transaction
    const rahul = insertedCustomers.find(c => c.name === "Rahul Sharma")
    const rtx4070 = insertedProducts.find(p => p.sku === "NV-RTX-4070TI")
    
    if (rahul && rtx4070) {
      const sale1 = await db.insert(schema.transaction).values({
        userId: user.id,
        customerId: rahul.id,
        referenceId: "INV-1001",
        type: "SALE",
        totalAmount: rtx4070.sellingPrice,
        profit: (Number(rtx4070.sellingPrice) - Number(rtx4070.costPrice)).toFixed(2),
        paymentStatus: "UNPAID",
        paymentMethod: "CASH",
        notes: "Promised to pay next week.",
      }).returning()

      await db.insert(schema.transactionItem).values({
        transactionId: sale1[0].id,
        productId: rtx4070.id,
        quantity: 1,
        unitPrice: rtx4070.sellingPrice,
      })
    }

    // TechVision's PARTIAL/UNPAID transaction
    const techVision = insertedCustomers.find(c => c.name === "TechVision Solutions")
    const i7 = insertedProducts.find(p => p.sku === "INTEL-I7-13700K")
    const msiMobo = insertedProducts.find(p => p.sku === "MSI-B650-TOM")
    const ssd = insertedProducts.find(p => p.sku === "SAM-980PRO-1TB")

    if (techVision && i7 && msiMobo && ssd) {
      const totalAmt = (Number(i7.sellingPrice) * 2) + (Number(msiMobo.sellingPrice) * 2) + (Number(ssd.sellingPrice) * 2)
      const costTotal = (Number(i7.costPrice) * 2) + (Number(msiMobo.costPrice) * 2) + (Number(ssd.costPrice) * 2)

      const sale2 = await db.insert(schema.transaction).values({
        userId: user.id,
        customerId: techVision.id,
        referenceId: "INV-1002",
        type: "SALE",
        totalAmount: totalAmt.toFixed(2),
        profit: (totalAmt - costTotal).toFixed(2),
        paymentStatus: "PARTIAL",
        paymentMethod: "UPI",
        notes: "Paid 50k advance, rest on credit.",
      }).returning()

      await db.insert(schema.transactionItem).values([
        {
          transactionId: sale2[0].id,
          productId: i7.id,
          quantity: 2,
          unitPrice: i7.sellingPrice,
        },
        {
          transactionId: sale2[0].id,
          productId: msiMobo.id,
          quantity: 2,
          unitPrice: msiMobo.sellingPrice,
        },
        {
          transactionId: sale2[0].id,
          productId: ssd.id,
          quantity: 2,
          unitPrice: ssd.sellingPrice,
        }
      ])
    }

    console.log("✅ Seeding complete!")
  } catch (error) {
    console.error("❌ Error during seeding:", error)
  } finally {
    // Crucial: Close the database connection so the script exits automatically
    await connection.end()
  }
}

main()

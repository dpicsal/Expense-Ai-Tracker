import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  color: text("color").notNull(), // Store the color class for the category
  budget: decimal("budget", { precision: 10, scale: 2 }), // Legacy budget field (keeping for backward compatibility)
  allocatedFunds: decimal("allocated_funds", { precision: 10, scale: 2 }).default("0"), // Allocated funds for this category
  icon: text("icon").default("Tag"), // Lucide icon name
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Fund History table - tracks fund additions to categories with date and amount
export const fundHistory = pgTable("fund_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"), // Optional description for the fund addition
  addedAt: timestamp("added_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Payment Methods table - tracks user's payment accounts
export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g. "Chase Credit Card", "My Cash Wallet" 
  type: text("type").notNull(), // cash, credit_card, debit_card, bank_transfer, digital_wallet
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0"),
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  paymentMethod: text("payment_method").notNull().default("cash"),
  date: timestamp("date").notNull().defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().trim().min(1, "Category name is required"),
  allocatedFunds: z.coerce.number().min(0, "Allocated funds must be non-negative").optional(),
});


// Expenses schema
export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
}).extend({
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.coerce.date(),
  paymentMethod: z.string().trim().min(1, "Payment method is required"),
});

// Fund History schemas
export const insertFundHistorySchema = createInsertSchema(fundHistory).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.coerce.number().positive("Amount must be positive"),
  addedAt: z.coerce.date(),
});

// Payment Method schemas
export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().trim().min(1, "Payment method name is required"),
  type: z.enum(["cash", "credit_card", "debit_card", "bank_transfer", "digital_wallet"], {
    errorMap: () => ({ message: "Please select a valid payment method type" })
  }),
  balance: z.coerce.number().optional(),
  creditLimit: z.coerce.number().positive().optional(),
  isActive: z.boolean().optional(),
});

// Type exports

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertFundHistory = z.infer<typeof insertFundHistorySchema>;
export type FundHistory = typeof fundHistory.$inferSelect;

export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

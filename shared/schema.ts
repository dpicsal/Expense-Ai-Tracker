import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  color: text("color").notNull(), // Store the color class for the category
  budget: decimal("budget", { precision: 10, scale: 2 }).default("0"), // Monthly budget for this category
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

// Payment Methods table - manages individual payment methods with balances
export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // User-defined name like "Main Credit Card", "Cash Wallet", etc.
  type: text("type").notNull(), // cash, credit_card, debit_card, bank_transfer, digital_wallet, other
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0"), // Current available balance
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }), // For credit cards (optional)
  isActive: boolean("is_active").notNull().default(true), // Can be disabled without deletion
  color: text("color").notNull().default("bg-gray-100"), // Visual identifier
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Transactions table - unified for both income and expenses
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  type: text("type").notNull(), // "income" or "expense"
  paymentMethodId: varchar("payment_method_id").notNull().references(() => paymentMethods.id, { onDelete: "restrict" }),
  date: timestamp("date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Keep the existing expenses table for backward compatibility, but mark as legacy
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  paymentMethod: text("payment_method").notNull().default("cash"), // Payment method: cash, credit_card, debit_card, etc.
  date: timestamp("date").notNull().defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  budget: z.coerce.number().min(0, "Budget must be non-negative").optional(),
  allocatedFunds: z.coerce.number().min(0, "Allocated funds must be non-negative").optional(),
});

const paymentMethodEnum = z.enum(["cash", "credit_card", "debit_card", "bank_transfer", "digital_wallet", "other"]);
const transactionTypeEnum = z.enum(["income", "expense"]);

// Payment Methods schemas
export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  balance: z.coerce.number(), // Allow negative balances for overdrafts, credit card debt, etc.
  creditLimit: z.coerce.number().min(0, "Credit limit must be non-negative").optional(),
  type: paymentMethodEnum,
});

// Transactions schemas (unified for income and expenses)
export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.coerce.date(),
  type: transactionTypeEnum,
});

// Legacy expenses schema (keeping for backward compatibility)
export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
}).extend({
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.coerce.date(),
  paymentMethod: paymentMethodEnum,
});

// Fund History schemas
export const insertFundHistorySchema = createInsertSchema(fundHistory).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.coerce.number().positive("Amount must be positive"),
  addedAt: z.coerce.date(),
});

// Type exports
export type PaymentMethodType = z.infer<typeof paymentMethodEnum>;
export const PAYMENT_METHOD_TYPES = paymentMethodEnum.options;

export type TransactionType = z.infer<typeof transactionTypeEnum>;
export const TRANSACTION_TYPES = transactionTypeEnum.options;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertFundHistory = z.infer<typeof insertFundHistorySchema>;
export type FundHistory = typeof fundHistory.$inferSelect;

// Legacy types (keeping for backward compatibility)
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

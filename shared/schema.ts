import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp } from "drizzle-orm/pg-core";
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

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
}).extend({
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.coerce.date(),
  paymentMethod: paymentMethodEnum,
});

export type PaymentMethod = z.infer<typeof paymentMethodEnum>;
export const PAYMENT_METHODS = paymentMethodEnum.options;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, integer } from "drizzle-orm/pg-core";
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
  maxBalance: decimal("max_balance", { precision: 10, scale: 2 }).default("0"), // Track highest balance for progress bars
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }),
  dueDate: integer("due_date"), // Day of month (1-31) when credit card payment is due
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Payment Method Fund History table - tracks fund additions/deposits to payment methods
export const paymentMethodFundHistory = pgTable("payment_method_fund_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentMethodId: varchar("payment_method_id").notNull().references(() => paymentMethods.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"), // Optional description for the fund addition
  addedAt: timestamp("added_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  paymentMethod: text("payment_method").notNull(),
  date: timestamp("date").notNull().defaultNow(),
});

// Telegram Bot Configuration table
export const telegramBotConfigs = pgTable("telegram_bot_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botToken: text("bot_token"), // Encrypted bot token
  webhookSecret: text("webhook_secret"), // Secret token for webhook validation
  chatWhitelist: text("chat_whitelist").array().default(sql`'{}'::text[]`), // Array of allowed chat IDs
  isEnabled: boolean("is_enabled").default(false),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Telegram User States - track conversation flows
export const telegramUserStates = pgTable("telegram_user_states", {
  chatId: text("chat_id").primaryKey(),
  state: text("state"), // Current conversation state (add_expense, add_fund, make_payment, etc.)
  data: text("data"), // JSON data for the current flow
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
  description: z.string().trim().min(1, "Description is required"),
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
  dueDate: z.coerce.number().int().min(1).max(31).optional(),
  isActive: z.boolean().optional(),
});

// Payment Method Fund History schemas
export const insertPaymentMethodFundHistorySchema = createInsertSchema(paymentMethodFundHistory).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.coerce.number().positive("Amount must be positive"),
  addedAt: z.coerce.date(),
});

// Telegram Bot Config schemas
export const insertTelegramBotConfigSchema = createInsertSchema(telegramBotConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  botToken: z.string().optional(),
  webhookSecret: z.string().optional(),
  chatWhitelist: z.array(z.string()).optional(),
  isEnabled: z.boolean().optional(),
});

// Type exports

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertFundHistory = z.infer<typeof insertFundHistorySchema>;
export type FundHistory = typeof fundHistory.$inferSelect;

export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;

export type InsertPaymentMethodFundHistory = z.infer<typeof insertPaymentMethodFundHistorySchema>;
export type PaymentMethodFundHistory = typeof paymentMethodFundHistory.$inferSelect;

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export type InsertTelegramBotConfig = z.infer<typeof insertTelegramBotConfigSchema>;
export type TelegramBotConfig = typeof telegramBotConfigs.$inferSelect;

export type TelegramUserState = typeof telegramUserStates.$inferSelect;
export type InsertTelegramUserState = typeof telegramUserStates.$inferInsert;

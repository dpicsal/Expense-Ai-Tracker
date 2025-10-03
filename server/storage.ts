import { 
  expenses, categories, fundHistory, paymentMethods, paymentMethodFundHistory, telegramBotConfigs,
  type Expense, type InsertExpense, type Category, type InsertCategory,
  type FundHistory, type InsertFundHistory, type PaymentMethod, type InsertPaymentMethod,
  type PaymentMethodFundHistory, type InsertPaymentMethodFundHistory,
  type TelegramBotConfig, type InsertTelegramBotConfig
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";

// Decimal conversion helpers to standardize handling between numbers and DB strings
function toDecimalString(value: number | string): string {
  if (typeof value === 'string') return value;
  return value.toString();
}

function toNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    throw new Error(`Cannot convert "${value}" to number`);
  }
  return parsed;
}

export interface IStorage {
  // Legacy expense management (keeping for backward compatibility)
  getAllExpenses(startDate?: Date, endDate?: Date): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;
  
  // Category management
  getAllCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryByName(name: string, tx?: any): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Fund History management
  getAllFundHistory(): Promise<FundHistory[]>;
  getFundHistory(id: string): Promise<FundHistory | undefined>;
  getFundHistoryByCategory(categoryId: string): Promise<FundHistory[]>;
  createFundHistory(fundHistory: InsertFundHistory): Promise<FundHistory>;
  updateFundHistory(id: string, fundHistory: Partial<InsertFundHistory>): Promise<FundHistory | undefined>;
  deleteFundHistory(id: string): Promise<boolean>;
  addFundsToCategory(categoryId: string, amount: number, description?: string): Promise<{fundHistory: FundHistory, updatedCategory: Category}>;

  // Payment Method management
  getAllPaymentMethods(): Promise<PaymentMethod[]>;
  getPaymentMethod(id: string): Promise<PaymentMethod | undefined>;
  createPaymentMethod(paymentMethod: InsertPaymentMethod): Promise<PaymentMethod>;
  updatePaymentMethod(id: string, paymentMethod: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined>;
  deletePaymentMethod(id: string): Promise<boolean>;
  addFundsToPaymentMethod(paymentMethodId: string, amount: number, description?: string): Promise<{fundHistory: PaymentMethodFundHistory, updatedPaymentMethod: PaymentMethod}>;

  // Payment Method Fund History management
  getAllPaymentMethodFundHistory(): Promise<PaymentMethodFundHistory[]>;
  getPaymentMethodFundHistory(id: string): Promise<PaymentMethodFundHistory | undefined>;
  getPaymentMethodFundHistoryByPaymentMethod(paymentMethodId: string): Promise<PaymentMethodFundHistory[]>;
  createPaymentMethodFundHistory(fundHistory: InsertPaymentMethodFundHistory): Promise<PaymentMethodFundHistory>;
  updatePaymentMethodFundHistory(id: string, fundHistory: Partial<InsertPaymentMethodFundHistory>): Promise<PaymentMethodFundHistory | undefined>;
  deletePaymentMethodFundHistory(id: string): Promise<boolean>;

  // Data reset management
  resetCategory(categoryId: string): Promise<{deletedExpenses: number, deletedFundHistory: number, resetCategory: Category}>;
  
  // Backup & Restore
  clearAllData(): Promise<void>;

  // Telegram Bot Config management
  getTelegramBotConfig(): Promise<TelegramBotConfig | undefined>;
  createOrUpdateTelegramBotConfig(config: InsertTelegramBotConfig): Promise<TelegramBotConfig>;
  deleteTelegramBotConfig(): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getAllExpenses(startDate?: Date, endDate?: Date): Promise<Expense[]> {
    const conditions = [];
    
    if (startDate) {
      conditions.push(gte(expenses.date, startDate));
    }
    
    if (endDate) {
      // Add one day to endDate to include the entire end date
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(lte(expenses.date, endOfDay));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(expenses).where(and(...conditions)).orderBy(desc(expenses.date));
    }
    
    return await db.select().from(expenses).orderBy(desc(expenses.date));
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || undefined;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    return await db.transaction(async (tx) => {
      // Create the expense
      const [expense] = await tx
        .insert(expenses)
        .values({
          ...insertExpense,
          amount: toDecimalString(insertExpense.amount),
        })
        .returning();

      // Deduct from category allocated funds
      const category = await this.getCategoryByName(insertExpense.category, tx);
      if (category) {
        await tx
          .update(categories)
          .set({
            allocatedFunds: sql`allocated_funds - ${toDecimalString(insertExpense.amount)}`,
            updatedAt: sql`NOW()`
          })
          .where(eq(categories.id, category.id));
      }

      // Deduct from payment method balance
      if (insertExpense.paymentMethod) {
        await tx
          .update(paymentMethods)
          .set({
            balance: sql`balance - ${toDecimalString(insertExpense.amount)}`,
            updatedAt: sql`NOW()`
          })
          .where(eq(paymentMethods.id, insertExpense.paymentMethod));
      }

      return expense;
    });
  }

  async updateExpense(id: string, updateData: Partial<InsertExpense>): Promise<Expense | undefined> {
    return await db.transaction(async (tx) => {
      // Get the old expense to revert category fund changes
      const [oldExpense] = await tx.select().from(expenses).where(eq(expenses.id, id));
      if (!oldExpense) return undefined;

      const updateValues: any = { ...updateData };
      if (updateData.amount !== undefined) {
        updateValues.amount = toDecimalString(updateData.amount);
      }
      
      const [expense] = await tx
        .update(expenses)
        .set(updateValues)
        .where(eq(expenses.id, id))
        .returning();

      if (!expense) return undefined;

      // Handle category fund changes
      const oldCategory = await this.getCategoryByName(oldExpense.category, tx);
      const newCategory = updateData.category ? await this.getCategoryByName(updateData.category, tx) : oldCategory;
      const newAmount = updateData.amount ?? parseFloat(oldExpense.amount);
      
      // Restore funds to old category
      if (oldCategory) {
        await tx
          .update(categories)
          .set({
            allocatedFunds: sql`allocated_funds + ${oldExpense.amount}`,
            updatedAt: sql`NOW()`
          })
          .where(eq(categories.id, oldCategory.id));
      }
      
      // Deduct funds from new category
      if (newCategory) {
        await tx
          .update(categories)
          .set({
            allocatedFunds: sql`allocated_funds - ${toDecimalString(newAmount)}`,
            updatedAt: sql`NOW()`
          })
          .where(eq(categories.id, newCategory.id));
      }

      // Handle payment method balance changes
      const oldPaymentMethod = oldExpense.paymentMethod;
      const newPaymentMethod = updateData.paymentMethod ?? oldPaymentMethod;
      
      // Restore balance to old payment method
      if (oldPaymentMethod) {
        await tx
          .update(paymentMethods)
          .set({
            balance: sql`balance + ${oldExpense.amount}`,
            updatedAt: sql`NOW()`
          })
          .where(eq(paymentMethods.id, oldPaymentMethod));
      }
      
      // Deduct balance from new payment method
      if (newPaymentMethod) {
        await tx
          .update(paymentMethods)
          .set({
            balance: sql`balance - ${toDecimalString(newAmount)}`,
            updatedAt: sql`NOW()`
          })
          .where(eq(paymentMethods.id, newPaymentMethod));
      }

      return expense;
    });
  }

  async deleteExpense(id: string): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Get the expense to restore category funds
      const [expense] = await tx.select().from(expenses).where(eq(expenses.id, id));
      if (!expense) return false;

      const result = await tx.delete(expenses).where(eq(expenses.id, id));
      const deleted = (result.rowCount || 0) > 0;

      if (deleted) {
        // Restore allocated funds to category
        const category = await this.getCategoryByName(expense.category, tx);
        if (category) {
          await tx
            .update(categories)
            .set({
              allocatedFunds: sql`allocated_funds + ${expense.amount}`,
              updatedAt: sql`NOW()`
            })
            .where(eq(categories.id, category.id));
        }

        // Restore balance to payment method
        if (expense.paymentMethod) {
          await tx
            .update(paymentMethods)
            .set({
              balance: sql`balance + ${expense.amount}`,
              updatedAt: sql`NOW()`
            })
            .where(eq(paymentMethods.id, expense.paymentMethod));
        }
      }

      return deleted;
    });
  }

  // Category management methods
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async getCategoryByName(name: string, tx?: any): Promise<Category | undefined> {
    const dbInstance = tx || db;
    const [category] = await dbInstance.select().from(categories).where(eq(categories.name, name));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const categoryValues: any = { 
      ...insertCategory,
      updatedAt: sql`NOW()`
    };
    if (insertCategory.allocatedFunds !== undefined) {
      categoryValues.allocatedFunds = toDecimalString(insertCategory.allocatedFunds);
    }
    
    const [category] = await db
      .insert(categories)
      .values(categoryValues)
      .returning();
    return category;
  }

  async updateCategory(id: string, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const updateValues: any = { 
      ...updateData,
      updatedAt: sql`NOW()`
    };
    if (updateData.allocatedFunds !== undefined) {
      updateValues.allocatedFunds = toDecimalString(updateData.allocatedFunds);
    }
    
    const [category] = await db
      .update(categories)
      .set(updateValues)
      .where(eq(categories.id, id))
      .returning();
    return category || undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount || 0) > 0;
  }

  // =============== FUND HISTORY METHODS ===============

  async getAllFundHistory(): Promise<FundHistory[]> {
    return await db.select().from(fundHistory).orderBy(desc(fundHistory.addedAt));
  }

  async getFundHistory(id: string): Promise<FundHistory | undefined> {
    const [history] = await db.select().from(fundHistory).where(eq(fundHistory.id, id));
    return history || undefined;
  }

  async getFundHistoryByCategory(categoryId: string): Promise<FundHistory[]> {
    return await db.select().from(fundHistory)
      .where(eq(fundHistory.categoryId, categoryId))
      .orderBy(desc(fundHistory.addedAt));
  }

  async createFundHistory(insertFundHistory: InsertFundHistory): Promise<FundHistory> {
    const historyValues: any = {
      ...insertFundHistory,
      amount: toDecimalString(insertFundHistory.amount),
    };
    
    const [history] = await db
      .insert(fundHistory)
      .values(historyValues)
      .returning();
    return history;
  }

  async updateFundHistory(id: string, updateData: Partial<InsertFundHistory>): Promise<FundHistory | undefined> {
    return await db.transaction(async (tx) => {
      // Get the old fund history to calculate balance adjustment
      const [oldHistory] = await tx.select().from(fundHistory).where(eq(fundHistory.id, id));
      if (!oldHistory) return undefined;

      const updateValues: any = { ...updateData };
      if (updateData.amount !== undefined) {
        updateValues.amount = toDecimalString(updateData.amount);
      }
      
      const [updatedHistory] = await tx
        .update(fundHistory)
        .set(updateValues)
        .where(eq(fundHistory.id, id))
        .returning();

      if (!updatedHistory) return undefined;

      const oldCategoryId = oldHistory.categoryId;
      const newCategoryId = updateData.categoryId ?? oldHistory.categoryId;
      const oldAmount = oldHistory.amount; // String from database (DECIMAL)
      const newAmount = updateData.amount !== undefined ? toDecimalString(updateData.amount) : oldHistory.amount;

      // Handle category change or amount change
      if (oldCategoryId !== newCategoryId) {
        // Category changed: subtract old amount from old category, add new amount to new category
        await tx
          .update(categories)
          .set({
            allocatedFunds: sql`allocated_funds - ${oldAmount}`,
            updatedAt: sql`NOW()`
          })
          .where(eq(categories.id, oldCategoryId));

        await tx
          .update(categories)
          .set({
            allocatedFunds: sql`allocated_funds + ${newAmount}`,
            updatedAt: sql`NOW()`
          })
          .where(eq(categories.id, newCategoryId));
      } else if (updateData.amount !== undefined) {
        // Same category, but amount changed - use SQL arithmetic to avoid precision issues
        await tx
          .update(categories)
          .set({
            allocatedFunds: sql`allocated_funds + (${newAmount} - ${oldAmount})`,
            updatedAt: sql`NOW()`
          })
          .where(eq(categories.id, oldCategoryId));
      }

      return updatedHistory;
    });
  }

  async deleteFundHistory(id: string): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Get the fund history to adjust category balance
      const [history] = await tx.select().from(fundHistory).where(eq(fundHistory.id, id));
      if (!history) return false;

      const result = await tx.delete(fundHistory).where(eq(fundHistory.id, id));
      const deleted = (result.rowCount || 0) > 0;

      if (deleted) {
        // Subtract the amount from category allocated funds
        await tx
          .update(categories)
          .set({
            allocatedFunds: sql`allocated_funds - ${history.amount}`,
            updatedAt: sql`NOW()`
          })
          .where(eq(categories.id, history.categoryId));
      }

      return deleted;
    });
  }

  async addFundsToCategory(categoryId: string, amount: number, description?: string): Promise<{fundHistory: FundHistory, updatedCategory: Category}> {
    return await db.transaction(async (tx) => {
      // Create fund history record
      const [history] = await tx
        .insert(fundHistory)
        .values({
          categoryId,
          amount: toDecimalString(amount),
          description: description || null,
          addedAt: new Date(),
        })
        .returning();

      // Update category allocated funds
      const [updatedCategory] = await tx
        .update(categories)
        .set({
          allocatedFunds: sql`allocated_funds + ${toDecimalString(amount)}`,
          updatedAt: sql`NOW()`
        })
        .where(eq(categories.id, categoryId))
        .returning();

      if (!updatedCategory) {
        throw new Error('Category not found');
      }

      return { fundHistory: history, updatedCategory };
    });
  }

  // Payment Method management methods
  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods).orderBy(desc(paymentMethods.createdAt));
  }

  async getPaymentMethod(id: string): Promise<PaymentMethod | undefined> {
    const [paymentMethod] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
    return paymentMethod || undefined;
  }

  async createPaymentMethod(insertPaymentMethod: InsertPaymentMethod): Promise<PaymentMethod> {
    const balance = insertPaymentMethod.balance ? toDecimalString(insertPaymentMethod.balance) : "0";
    const [paymentMethod] = await db
      .insert(paymentMethods)
      .values({
        ...insertPaymentMethod,
        balance,
        maxBalance: balance, // Set maxBalance to initial balance
        creditLimit: insertPaymentMethod.creditLimit ? toDecimalString(insertPaymentMethod.creditLimit) : null,
        updatedAt: sql`NOW()`,
      })
      .returning();

    return paymentMethod;
  }

  async updatePaymentMethod(id: string, updatePaymentMethod: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined> {
    return await db.transaction(async (tx) => {
      // Get current payment method to check maxBalance
      const [currentPaymentMethod] = await tx.select().from(paymentMethods).where(eq(paymentMethods.id, id));
      if (!currentPaymentMethod) return undefined;

      const updateData: any = {
        ...updatePaymentMethod,
        updatedAt: sql`NOW()`,
      };

      // Handle decimal conversions
      if (updatePaymentMethod.balance !== undefined) {
        updateData.balance = toDecimalString(updatePaymentMethod.balance);
        
        // Update maxBalance if new balance is higher
        const newBalance = toNumber(updateData.balance);
        const currentMaxBalance = toNumber(currentPaymentMethod.maxBalance || "0");
        if (newBalance > currentMaxBalance) {
          updateData.maxBalance = toDecimalString(newBalance);
        }
      }
      if (updatePaymentMethod.creditLimit !== undefined) {
        updateData.creditLimit = updatePaymentMethod.creditLimit ? toDecimalString(updatePaymentMethod.creditLimit) : null;
      }

      const [paymentMethod] = await tx
        .update(paymentMethods)
        .set(updateData)
        .where(eq(paymentMethods.id, id))
        .returning();

      return paymentMethod || undefined;
    });
  }

  async deletePaymentMethod(id: string): Promise<boolean> {
    const result = await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
    return (result.rowCount || 0) > 0;
  }

  async addFundsToPaymentMethod(paymentMethodId: string, amount: number, description?: string): Promise<{fundHistory: PaymentMethodFundHistory, updatedPaymentMethod: PaymentMethod}> {
    return await db.transaction(async (tx) => {
      // First verify payment method exists
      const [existingPaymentMethod] = await tx
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.id, paymentMethodId));

      if (!existingPaymentMethod) {
        throw new Error('Payment method not found');
      }

      // Create fund history record
      const [history] = await tx
        .insert(paymentMethodFundHistory)
        .values({
          paymentMethodId,
          amount: toDecimalString(amount),
          description: description || null,
          addedAt: new Date(),
        })
        .returning();

      // Update payment method balance
      const [updatedPaymentMethod] = await tx
        .update(paymentMethods)
        .set({
          balance: sql`balance + ${toDecimalString(amount)}`,
          maxBalance: sql`CASE WHEN balance + ${toDecimalString(amount)} > max_balance THEN balance + ${toDecimalString(amount)} ELSE max_balance END`,
          updatedAt: sql`NOW()`
        })
        .where(eq(paymentMethods.id, paymentMethodId))
        .returning();

      if (!updatedPaymentMethod) {
        throw new Error('Payment method not found');
      }

      return { fundHistory: history, updatedPaymentMethod };
    });
  }

  async getAllPaymentMethodFundHistory(): Promise<PaymentMethodFundHistory[]> {
    return await db.select().from(paymentMethodFundHistory).orderBy(desc(paymentMethodFundHistory.addedAt));
  }

  async getPaymentMethodFundHistory(id: string): Promise<PaymentMethodFundHistory | undefined> {
    const [history] = await db.select().from(paymentMethodFundHistory).where(eq(paymentMethodFundHistory.id, id));
    return history || undefined;
  }

  async getPaymentMethodFundHistoryByPaymentMethod(paymentMethodId: string): Promise<PaymentMethodFundHistory[]> {
    return await db.select().from(paymentMethodFundHistory)
      .where(eq(paymentMethodFundHistory.paymentMethodId, paymentMethodId))
      .orderBy(desc(paymentMethodFundHistory.addedAt));
  }

  async createPaymentMethodFundHistory(insertFundHistory: InsertPaymentMethodFundHistory): Promise<PaymentMethodFundHistory> {
    const historyValues: any = {
      ...insertFundHistory,
      amount: toDecimalString(insertFundHistory.amount),
    };
    
    const [history] = await db
      .insert(paymentMethodFundHistory)
      .values(historyValues)
      .returning();
    return history;
  }

  async updatePaymentMethodFundHistory(id: string, updateData: Partial<InsertPaymentMethodFundHistory>): Promise<PaymentMethodFundHistory | undefined> {
    return await db.transaction(async (tx) => {
      // Get the old fund history to calculate balance adjustment
      const [oldHistory] = await tx.select().from(paymentMethodFundHistory).where(eq(paymentMethodFundHistory.id, id));
      if (!oldHistory) return undefined;

      const updateValues: any = { ...updateData };
      if (updateData.amount !== undefined) {
        updateValues.amount = toDecimalString(updateData.amount);
      }
      
      const [updatedHistory] = await tx
        .update(paymentMethodFundHistory)
        .set(updateValues)
        .where(eq(paymentMethodFundHistory.id, id))
        .returning();

      if (!updatedHistory) return undefined;

      const oldPaymentMethodId = oldHistory.paymentMethodId;
      const newPaymentMethodId = updateData.paymentMethodId ?? oldHistory.paymentMethodId;
      const oldAmount = oldHistory.amount;
      const newAmount = updateData.amount !== undefined ? toDecimalString(updateData.amount) : oldHistory.amount;

      // Handle payment method change or amount change
      if (oldPaymentMethodId !== newPaymentMethodId) {
        // Payment method changed: subtract old amount from old method, add new amount to new method
        await tx
          .update(paymentMethods)
          .set({
            balance: sql`balance - ${oldAmount}`,
            updatedAt: sql`NOW()`
          })
          .where(eq(paymentMethods.id, oldPaymentMethodId));

        await tx
          .update(paymentMethods)
          .set({
            balance: sql`balance + ${newAmount}`,
            updatedAt: sql`NOW()`
          })
          .where(eq(paymentMethods.id, newPaymentMethodId));
      } else if (updateData.amount !== undefined) {
        // Same payment method, but amount changed
        await tx
          .update(paymentMethods)
          .set({
            balance: sql`balance + (${newAmount} - ${oldAmount})`,
            updatedAt: sql`NOW()`
          })
          .where(eq(paymentMethods.id, oldPaymentMethodId));
      }

      return updatedHistory;
    });
  }

  async deletePaymentMethodFundHistory(id: string): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Get the fund history to adjust payment method balance
      const [history] = await tx.select().from(paymentMethodFundHistory).where(eq(paymentMethodFundHistory.id, id));
      if (!history) return false;

      const result = await tx.delete(paymentMethodFundHistory).where(eq(paymentMethodFundHistory.id, id));
      const deleted = (result.rowCount || 0) > 0;

      if (deleted) {
        // Subtract the amount from payment method balance
        await tx
          .update(paymentMethods)
          .set({
            balance: sql`balance - ${history.amount}`,
            updatedAt: sql`NOW()`
          })
          .where(eq(paymentMethods.id, history.paymentMethodId));
      }

      return deleted;
    });
  }

  async resetCategory(categoryId: string): Promise<{deletedExpenses: number, deletedFundHistory: number, resetCategory: Category}> {
    return await db.transaction(async (tx) => {
      // Get the category first to ensure it exists
      const [category] = await tx.select().from(categories).where(eq(categories.id, categoryId));
      if (!category) {
        throw new Error("Category not found");
      }

      // Delete all expenses for this category (no payment method balance updates needed)
      const categoryExpenses = await tx.select().from(expenses).where(eq(expenses.category, category.name));
      let deletedExpensesCount = 0;
      
      for (const expense of categoryExpenses) {
        const result = await tx.delete(expenses).where(eq(expenses.id, expense.id));
        if ((result.rowCount || 0) > 0) {
          deletedExpensesCount++;
        }
      }

      // Delete all fund history for this category and reset allocated funds
      const categoryFundHistory = await tx.select().from(fundHistory).where(eq(fundHistory.categoryId, categoryId));
      let deletedFundHistoryCount = 0;
      
      for (const history of categoryFundHistory) {
        const result = await tx.delete(fundHistory).where(eq(fundHistory.id, history.id));
        if ((result.rowCount || 0) > 0) {
          deletedFundHistoryCount++;
        }
      }

      // Reset the category's allocated funds to 0
      const [resetCategory] = await tx
        .update(categories)
        .set({
          allocatedFunds: "0",
          updatedAt: sql`NOW()`
        })
        .where(eq(categories.id, categoryId))
        .returning();

      return {
        deletedExpenses: deletedExpensesCount,
        deletedFundHistory: deletedFundHistoryCount,
        resetCategory: resetCategory
      };
    });
  }

  async clearAllData(): Promise<void> {
    await db.transaction(async (tx) => {
      // Delete in order to respect foreign key constraints
      await tx.delete(expenses);
      await tx.delete(fundHistory);
      await tx.delete(paymentMethodFundHistory);
      await tx.delete(paymentMethods);
      await tx.delete(categories);
    });
  }

  async getTelegramBotConfig(): Promise<TelegramBotConfig | undefined> {
    const [config] = await db.select().from(telegramBotConfigs).limit(1);
    return config || undefined;
  }

  async createOrUpdateTelegramBotConfig(insertConfig: InsertTelegramBotConfig): Promise<TelegramBotConfig> {
    const existing = await this.getTelegramBotConfig();
    
    if (existing) {
      const [updated] = await db
        .update(telegramBotConfigs)
        .set({
          ...insertConfig,
          updatedAt: sql`NOW()`,
        })
        .where(eq(telegramBotConfigs.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(telegramBotConfigs)
        .values(insertConfig)
        .returning();
      return created;
    }
  }

  async deleteTelegramBotConfig(): Promise<boolean> {
    const existing = await this.getTelegramBotConfig();
    if (!existing) return false;
    
    const result = await db.delete(telegramBotConfigs).where(eq(telegramBotConfigs.id, existing.id));
    return (result.rowCount || 0) > 0;
  }

}

export const storage = new DatabaseStorage();

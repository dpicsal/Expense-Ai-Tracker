import { 
  expenses, categories, fundHistory,
  type Expense, type InsertExpense, type Category, type InsertCategory,
  type FundHistory, type InsertFundHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

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
  getAllExpenses(): Promise<Expense[]>;
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


  // Data reset management
  resetCategory(categoryId: string): Promise<{deletedExpenses: number, deletedTransactions: number, deletedFundHistory: number, resetCategory: Category}>;
}

export class DatabaseStorage implements IStorage {
  async getAllExpenses(): Promise<Expense[]> {
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



  async resetCategory(categoryId: string): Promise<{deletedExpenses: number, deletedTransactions: number, deletedFundHistory: number, resetCategory: Category}> {
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
        deletedTransactions: 0, // No transactions anymore
        deletedFundHistory: deletedFundHistoryCount,
        resetCategory: resetCategory
      };
    });
  }

}

export const storage = new DatabaseStorage();

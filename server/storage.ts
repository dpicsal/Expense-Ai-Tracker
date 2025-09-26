import { 
  expenses, categories, paymentMethods, transactions, fundHistory,
  type Expense, type InsertExpense, type Category, type InsertCategory,
  type PaymentMethod, type InsertPaymentMethod, type Transaction, type InsertTransaction,
  type FundHistory, type InsertFundHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Legacy expense management (keeping for backward compatibility)
  getAllExpenses(): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense, paymentMethodId?: string): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>, paymentMethodId?: string): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;
  
  // Category management
  getAllCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryByName(name: string): Promise<Category | undefined>;
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
  updatePaymentMethodBalance(id: string, amount: number, isIncome: boolean): Promise<PaymentMethod | undefined>;
  getPaymentMethodByType(type: string): Promise<PaymentMethod | undefined>;

  // Transaction management (unified income/expense)
  getAllTransactions(): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getAllExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.date));
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || undefined;
  }

  async createExpense(insertExpense: InsertExpense, paymentMethodId?: string): Promise<Expense> {
    return await db.transaction(async (tx) => {
      // Create the expense
      const [expense] = await tx
        .insert(expenses)
        .values({
          ...insertExpense,
          amount: insertExpense.amount.toString(),
        })
        .returning();

      // Update the payment method balance using either the provided ID or find by type
      if (paymentMethodId) {
        // Use the specific payment method ID provided
        await this.updatePaymentMethodBalance(
          paymentMethodId,
          insertExpense.amount,
          false, // expense reduces balance
          tx
        );
      } else {
        // Fallback: find payment method by type (for backward compatibility)
        const paymentMethod = await this.getPaymentMethodByType(insertExpense.paymentMethod);
        if (paymentMethod) {
          await this.updatePaymentMethodBalance(
            paymentMethod.id,
            insertExpense.amount,
            false, // expense reduces balance
            tx
          );
        }
      }

      // Deduct from category allocated funds
      const category = await this.getCategoryByName(insertExpense.category, tx);
      if (category) {
        await tx
          .update(categories)
          .set({
            allocatedFunds: sql`allocated_funds - ${insertExpense.amount.toString()}`,
            updatedAt: sql`NOW()`
          })
          .where(eq(categories.id, category.id));
      }

      return expense;
    });
  }

  async updateExpense(id: string, updateData: Partial<InsertExpense>, paymentMethodId?: string): Promise<Expense | undefined> {
    return await db.transaction(async (tx) => {
      // Get the old expense to revert balance changes
      const [oldExpense] = await tx.select().from(expenses).where(eq(expenses.id, id));
      if (!oldExpense) return undefined;

      const updateValues: any = { ...updateData };
      if (updateData.amount !== undefined) {
        updateValues.amount = updateData.amount.toString();
      }
      
      const [expense] = await tx
        .update(expenses)
        .set(updateValues)
        .where(eq(expenses.id, id))
        .returning();

      if (!expense) return undefined;

      // Revert old balance change
      const oldPaymentMethod = await this.getPaymentMethodByType(oldExpense.paymentMethod);
      if (oldPaymentMethod) {
        await this.updatePaymentMethodBalance(
          oldPaymentMethod.id,
          oldExpense.amount,
          true, // reverse the expense (add back to balance)
          tx
        );
      }

      // Apply new balance change
      const newAmount = updateData.amount ?? parseFloat(oldExpense.amount);
      
      if (paymentMethodId) {
        // Use the specific payment method ID provided (more accurate than type lookup)
        await this.updatePaymentMethodBalance(
          paymentMethodId,
          newAmount,
          false, // expense reduces balance
          tx
        );
      } else {
        // Fallback: use payment method type lookup for backward compatibility
        const newPaymentMethodType = updateData.paymentMethod ?? oldExpense.paymentMethod;
        const newPaymentMethod = await this.getPaymentMethodByType(newPaymentMethodType);
        if (newPaymentMethod) {
          await this.updatePaymentMethodBalance(
            newPaymentMethod.id,
            newAmount,
            false, // expense reduces balance
            tx
          );
        }
      }

      // Handle category fund changes
      const oldCategory = await this.getCategoryByName(oldExpense.category, tx);
      const newCategory = updateData.category ? await this.getCategoryByName(updateData.category, tx) : oldCategory;
      
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
            allocatedFunds: sql`allocated_funds - ${newAmount.toString()}`,
            updatedAt: sql`NOW()`
          })
          .where(eq(categories.id, newCategory.id));
      }

      return expense;
    });
  }

  async deleteExpense(id: string): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Get the expense to revert balance changes
      const [expense] = await tx.select().from(expenses).where(eq(expenses.id, id));
      if (!expense) return false;

      const result = await tx.delete(expenses).where(eq(expenses.id, id));
      const deleted = (result.rowCount || 0) > 0;

      if (deleted) {
        // Revert the balance change
        const paymentMethod = await this.getPaymentMethodByType(expense.paymentMethod);
        if (paymentMethod) {
          await this.updatePaymentMethodBalance(
            paymentMethod.id,
            expense.amount,
            true, // reverse the expense (add back to balance)
            tx
          );
        }
        
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
    if (insertCategory.budget !== undefined) {
      categoryValues.budget = insertCategory.budget.toString();
    }
    if (insertCategory.allocatedFunds !== undefined) {
      categoryValues.allocatedFunds = insertCategory.allocatedFunds.toString();
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
    if (updateData.budget !== undefined) {
      updateValues.budget = updateData.budget.toString();
    }
    if (updateData.allocatedFunds !== undefined) {
      updateValues.allocatedFunds = updateData.allocatedFunds.toString();
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
      amount: insertFundHistory.amount.toString(),
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
        updateValues.amount = updateData.amount.toString();
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
      const newAmount = updateData.amount?.toString() ?? oldHistory.amount; // Convert to string

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
          amount: amount.toString(),
          description: description || null,
          addedAt: new Date(),
        })
        .returning();

      // Update category allocated funds
      const [updatedCategory] = await tx
        .update(categories)
        .set({
          allocatedFunds: sql`allocated_funds + ${amount.toString()}`,
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

  // =============== PAYMENT METHOD METHODS ===============
  
  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    return await db.select().from(paymentMethods).orderBy(paymentMethods.name);
  }

  async getPaymentMethod(id: string): Promise<PaymentMethod | undefined> {
    const [paymentMethod] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
    return paymentMethod || undefined;
  }

  async createPaymentMethod(insertPaymentMethod: InsertPaymentMethod): Promise<PaymentMethod> {
    const paymentMethodValues: any = { 
      ...insertPaymentMethod,
      balance: insertPaymentMethod.balance.toString(),
      updatedAt: sql`NOW()`
    };
    if (insertPaymentMethod.creditLimit !== undefined) {
      paymentMethodValues.creditLimit = insertPaymentMethod.creditLimit.toString();
    }
    
    const [paymentMethod] = await db
      .insert(paymentMethods)
      .values(paymentMethodValues)
      .returning();
    return paymentMethod;
  }

  async updatePaymentMethod(id: string, updateData: Partial<InsertPaymentMethod>): Promise<PaymentMethod | undefined> {
    const updateValues: any = { 
      ...updateData,
      updatedAt: sql`NOW()`
    };
    if (updateData.balance !== undefined) {
      updateValues.balance = updateData.balance.toString();
    }
    if (updateData.creditLimit !== undefined) {
      updateValues.creditLimit = updateData.creditLimit.toString();
    }
    
    const [paymentMethod] = await db
      .update(paymentMethods)
      .set(updateValues)
      .where(eq(paymentMethods.id, id))
      .returning();
    return paymentMethod || undefined;
  }

  async deletePaymentMethod(id: string): Promise<boolean> {
    // Note: This will be restricted by the database due to foreign key constraint
    const result = await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getPaymentMethodByType(type: string): Promise<PaymentMethod | undefined> {
    const [paymentMethod] = await db.select().from(paymentMethods).where(eq(paymentMethods.type, type));
    return paymentMethod || undefined;
  }

  async updatePaymentMethodBalance(id: string, amount: string | number, isIncome: boolean, tx?: any): Promise<PaymentMethod | undefined> {
    const dbInstance = tx || db;
    
    // Perform atomic balance update using SQL arithmetic to avoid floating-point issues
    const amountStr = typeof amount === 'string' ? amount : amount.toString();
    const balanceChange = isIncome ? amountStr : `-${amountStr}`;
    
    const [updatedMethod] = await dbInstance
      .update(paymentMethods)
      .set({
        balance: sql`balance + ${balanceChange}`,
        updatedAt: sql`NOW()`
      })
      .where(eq(paymentMethods.id, id))
      .returning();
      
    return updatedMethod || undefined;
  }

  // =============== TRANSACTION METHODS ===============
  
  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.date));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    return await db.transaction(async (tx) => {
      // Create the transaction
      const [transaction] = await tx
        .insert(transactions)
        .values({
          ...insertTransaction,
          amount: insertTransaction.amount.toString(),
          updatedAt: sql`NOW()`
        })
        .returning();

      // Update payment method balance atomically within the same transaction
      await this.updatePaymentMethodBalance(
        insertTransaction.paymentMethodId, 
        insertTransaction.amount, 
        insertTransaction.type === 'income',
        tx
      );

      return transaction;
    });
  }

  async updateTransaction(id: string, updateData: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    return await db.transaction(async (tx) => {
      // Get the old transaction to revert balance changes (using tx instance)
      const [oldTransaction] = await tx.select().from(transactions).where(eq(transactions.id, id));
      if (!oldTransaction) return undefined;

      const updateValues: any = { 
        ...updateData,
        updatedAt: sql`NOW()`
      };
      if (updateData.amount !== undefined) {
        updateValues.amount = updateData.amount.toString();
      }
      
      const [transaction] = await tx
        .update(transactions)
        .set(updateValues)
        .where(eq(transactions.id, id))
        .returning();

      if (!transaction) return undefined;

      // Revert old balance change
      await this.updatePaymentMethodBalance(
        oldTransaction.paymentMethodId,
        oldTransaction.amount, // Pass string directly to avoid precision loss
        oldTransaction.type === 'expense', // Reverse the original operation
        tx
      );

      // Apply new balance change - use nullish coalescing for safe fallbacks
      const newPaymentMethodId = updateData.paymentMethodId ?? oldTransaction.paymentMethodId;
      const newAmount = updateData.amount ?? oldTransaction.amount; // No parseFloat to preserve precision
      const newType = updateData.type ?? oldTransaction.type;
      
      await this.updatePaymentMethodBalance(
        newPaymentMethodId,
        newAmount, // This could be number (from updateData) or string (fallback)
        newType === 'income',
        tx
      );

      return transaction;
    });
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Get the transaction to revert balance changes (using tx instance)
      const [transaction] = await tx.select().from(transactions).where(eq(transactions.id, id));
      if (!transaction) return false;

      const result = await tx.delete(transactions).where(eq(transactions.id, id));
      const deleted = (result.rowCount || 0) > 0;

      if (deleted) {
        // Revert the balance change atomically within the same transaction
        await this.updatePaymentMethodBalance(
          transaction.paymentMethodId,
          transaction.amount, // Pass string directly to avoid precision loss
          transaction.type === 'expense', // Reverse the original operation
          tx
        );
      }

      return deleted;
    });
  }
}

export const storage = new DatabaseStorage();

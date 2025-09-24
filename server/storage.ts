import { 
  expenses, categories, paymentMethods, transactions,
  type Expense, type InsertExpense, type Category, type InsertCategory,
  type PaymentMethod, type InsertPaymentMethod, type Transaction, type InsertTransaction
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Legacy expense management (keeping for backward compatibility)
  getAllExpenses(): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense, paymentMethodId?: string): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;
  
  // Category management
  getAllCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

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

      return expense;
    });
  }

  async updateExpense(id: string, updateData: Partial<InsertExpense>): Promise<Expense | undefined> {
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
      const newPaymentMethodType = updateData.paymentMethod ?? oldExpense.paymentMethod;
      const newAmount = updateData.amount ?? parseFloat(oldExpense.amount);
      
      const newPaymentMethod = await this.getPaymentMethodByType(newPaymentMethodType);
      if (newPaymentMethod) {
        await this.updatePaymentMethodBalance(
          newPaymentMethod.id,
          newAmount,
          false, // expense reduces balance
          tx
        );
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

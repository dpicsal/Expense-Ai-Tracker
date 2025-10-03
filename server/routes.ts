import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { 
  insertExpenseSchema, insertCategorySchema, 
  insertFundHistorySchema, insertPaymentMethodSchema,
  insertPaymentMethodFundHistorySchema, insertTelegramBotConfigSchema,
  expenses, categories, fundHistory, paymentMethods, paymentMethodFundHistory
} from "@shared/schema";
import { z } from "zod";
import { initializeTelegramBot, restartTelegramBot, sendTelegramMessage } from "./telegram-bot";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all expenses with optional date range filtering
  app.get("/api/expenses", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const expenses = await storage.getAllExpenses(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  // Get single expense
  app.get("/api/expenses/:id", async (req, res) => {
    try {
      const expense = await storage.getExpense(req.params.id);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      console.error("Error fetching expense:", error);
      res.status(500).json({ error: "Failed to fetch expense" });
    }
  });

  // Create new expense
  app.post("/api/expenses", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      
      // Create the expense using the new payment method ID approach
      const expense = await storage.createExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error creating expense:", error);
      res.status(500).json({ error: "Failed to create expense" });
    }
  });

  // Update expense
  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.partial().parse(req.body);
      const expense = await storage.updateExpense(req.params.id, validatedData);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error updating expense:", error);
      res.status(500).json({ error: "Failed to update expense" });
    }
  });

  // Delete expense
  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const success = await storage.deleteExpense(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  // =============== CATEGORY ROUTES ===============
  
  // Seed default categories
  app.post("/api/categories/seed", async (req, res) => {
    try {
      const { DEFAULT_CATEGORIES, CATEGORY_COLORS } = await import("@shared/constants");
      const seededCategories = [];
      
      // Map categories to their appropriate icons
      const categoryIcons = {
        "Food & Dining": "Utensils",
        "Transportation": "Car", 
        "Shopping": "ShoppingBag",
        "Entertainment": "Gamepad2",
        "Bills & Utilities": "Zap",
        "Healthcare": "Heart",
        "Travel": "Plane",
        "Education": "GraduationCap",
        "Other": "Tag"
      };
      
      for (const categoryName of DEFAULT_CATEGORIES) {
        try {
          // Check if category already exists
          const existingCategories = await storage.getAllCategories();
          const exists = existingCategories.some(cat => cat.name === categoryName);
          
          if (!exists) {
            const categoryData = {
              name: categoryName,
              color: CATEGORY_COLORS[categoryName] || CATEGORY_COLORS["Other"],
              icon: categoryIcons[categoryName] || "Tag"
            };
            
            const category = await storage.createCategory(categoryData);
            seededCategories.push(category);
          }
        } catch (error) {
          console.warn(`Failed to create category ${categoryName}:`, error);
        }
      }
      
      res.json({ 
        message: "Default categories seeded successfully", 
        seeded: seededCategories.length,
        categories: seededCategories 
      });
    } catch (error) {
      console.error("Error seeding categories:", error);
      res.status(500).json({ error: "Failed to seed categories" });
    }
  });
  
  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Get single category
  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  // Create new category
  app.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  // Update category
  app.put("/api/categories/:id", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedData);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  // Delete category
  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const success = await storage.deleteCategory(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Reset data for a specific category
  app.post("/api/categories/:id/reset", async (req, res) => {
    try {
      const result = await storage.resetCategory(req.params.id);
      res.json({ 
        message: "Category data reset successfully", 
        ...result 
      });
    } catch (error) {
      console.error("Error resetting category:", error);
      if (error instanceof Error && error.message === "Category not found") {
        return res.status(404).json({ error: "Category not found" });
      }
      res.status(500).json({ error: "Failed to reset category data" });
    }
  });


  // =============== FUND HISTORY ROUTES ===============

  // Get all fund history
  app.get("/api/fund-history", async (req, res) => {
    try {
      const fundHistory = await storage.getAllFundHistory();
      res.json(fundHistory);
    } catch (error) {
      console.error("Error fetching fund history:", error);
      res.status(500).json({ error: "Failed to fetch fund history" });
    }
  });

  // Get fund history by category
  app.get("/api/categories/:categoryId/fund-history", async (req, res) => {
    try {
      const fundHistory = await storage.getFundHistoryByCategory(req.params.categoryId);
      res.json(fundHistory);
    } catch (error) {
      console.error("Error fetching fund history for category:", error);
      res.status(500).json({ error: "Failed to fetch fund history for category" });
    }
  });

  // Get single fund history
  app.get("/api/fund-history/:id", async (req, res) => {
    try {
      const fundHistory = await storage.getFundHistory(req.params.id);
      if (!fundHistory) {
        return res.status(404).json({ error: "Fund history not found" });
      }
      res.json(fundHistory);
    } catch (error) {
      console.error("Error fetching fund history:", error);
      res.status(500).json({ error: "Failed to fetch fund history" });
    }
  });

  // Create new fund history (raw creation)
  app.post("/api/fund-history", async (req, res) => {
    try {
      const validatedData = insertFundHistorySchema.parse(req.body);
      const fundHistory = await storage.createFundHistory(validatedData);
      res.status(201).json(fundHistory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error creating fund history:", error);
      res.status(500).json({ error: "Failed to create fund history" });
    }
  });

  // Add funds to category (preferred method - creates history and updates category)
  app.post("/api/categories/:categoryId/add-funds", async (req, res) => {
    try {
      const { amount, description } = req.body;
      
      // Validate amount
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: "Amount must be a positive number" });
      }

      const result = await storage.addFundsToCategory(
        req.params.categoryId, 
        amount, 
        description
      );
      
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'Category not found') {
        return res.status(404).json({ error: "Category not found" });
      }
      console.error("Error adding funds to category:", error);
      res.status(500).json({ error: "Failed to add funds to category" });
    }
  });

  // Update fund history
  app.put("/api/fund-history/:id", async (req, res) => {
    try {
      const validatedData = insertFundHistorySchema.partial().parse(req.body);
      const fundHistory = await storage.updateFundHistory(req.params.id, validatedData);
      if (!fundHistory) {
        return res.status(404).json({ error: "Fund history not found" });
      }
      res.json(fundHistory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error updating fund history:", error);
      res.status(500).json({ error: "Failed to update fund history" });
    }
  });

  // Delete fund history
  app.delete("/api/fund-history/:id", async (req, res) => {
    try {
      const success = await storage.deleteFundHistory(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Fund history not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting fund history:", error);
      res.status(500).json({ error: "Failed to delete fund history" });
    }
  });

  // Payment Methods Routes
  // Get all payment methods
  app.get("/api/payment-methods", async (req, res) => {
    try {
      const paymentMethods = await storage.getAllPaymentMethods();
      res.json(paymentMethods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ error: "Failed to fetch payment methods" });
    }
  });

  // Get single payment method
  app.get("/api/payment-methods/:id", async (req, res) => {
    try {
      const paymentMethod = await storage.getPaymentMethod(req.params.id);
      if (!paymentMethod) {
        return res.status(404).json({ error: "Payment method not found" });
      }
      res.json(paymentMethod);
    } catch (error) {
      console.error("Error fetching payment method:", error);
      res.status(500).json({ error: "Failed to fetch payment method" });
    }
  });

  // Create new payment method
  app.post("/api/payment-methods", async (req, res) => {
    try {
      const validatedData = insertPaymentMethodSchema.parse(req.body);
      const paymentMethod = await storage.createPaymentMethod(validatedData);
      res.status(201).json(paymentMethod);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error creating payment method:", error);
      res.status(500).json({ error: "Failed to create payment method" });
    }
  });

  // Update payment method
  app.put("/api/payment-methods/:id", async (req, res) => {
    try {
      const validatedData = insertPaymentMethodSchema.partial().parse(req.body);
      const paymentMethod = await storage.updatePaymentMethod(req.params.id, validatedData);
      if (!paymentMethod) {
        return res.status(404).json({ error: "Payment method not found" });
      }
      res.json(paymentMethod);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error updating payment method:", error);
      res.status(500).json({ error: "Failed to update payment method" });
    }
  });

  // Delete payment method
  app.delete("/api/payment-methods/:id", async (req, res) => {
    try {
      const success = await storage.deletePaymentMethod(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Payment method not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting payment method:", error);
      res.status(500).json({ error: "Failed to delete payment method" });
    }
  });

  // Add funds to payment method
  app.post("/api/payment-methods/:id/add-funds", async (req, res) => {
    try {
      const { amount, description } = req.body;
      
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: "Amount must be a positive number" });
      }

      const result = await storage.addFundsToPaymentMethod(req.params.id, amount, description);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'Payment method not found') {
        return res.status(404).json({ error: "Payment method not found" });
      }
      console.error("Error adding funds to payment method:", error);
      res.status(500).json({ error: "Failed to add funds to payment method" });
    }
  });

  // Payment Method Fund History Routes
  // Get all payment method fund history
  app.get("/api/payment-method-fund-history", async (req, res) => {
    try {
      const fundHistory = await storage.getAllPaymentMethodFundHistory();
      res.json(fundHistory);
    } catch (error) {
      console.error("Error fetching payment method fund history:", error);
      res.status(500).json({ error: "Failed to fetch payment method fund history" });
    }
  });

  // Get payment method fund history by payment method ID
  app.get("/api/payment-methods/:paymentMethodId/fund-history", async (req, res) => {
    try {
      const fundHistory = await storage.getPaymentMethodFundHistoryByPaymentMethod(req.params.paymentMethodId);
      res.json(fundHistory);
    } catch (error) {
      console.error("Error fetching payment method fund history:", error);
      res.status(500).json({ error: "Failed to fetch payment method fund history" });
    }
  });

  // Get single payment method fund history
  app.get("/api/payment-method-fund-history/:id", async (req, res) => {
    try {
      const fundHistory = await storage.getPaymentMethodFundHistory(req.params.id);
      if (!fundHistory) {
        return res.status(404).json({ error: "Payment method fund history not found" });
      }
      res.json(fundHistory);
    } catch (error) {
      console.error("Error fetching payment method fund history:", error);
      res.status(500).json({ error: "Failed to fetch payment method fund history" });
    }
  });

  // Create new payment method fund history
  app.post("/api/payment-method-fund-history", async (req, res) => {
    try {
      const validatedData = insertPaymentMethodFundHistorySchema.parse(req.body);
      const fundHistory = await storage.createPaymentMethodFundHistory(validatedData);
      res.status(201).json(fundHistory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error creating payment method fund history:", error);
      res.status(500).json({ error: "Failed to create payment method fund history" });
    }
  });

  // Update payment method fund history
  app.put("/api/payment-method-fund-history/:id", async (req, res) => {
    try {
      const validatedData = insertPaymentMethodFundHistorySchema.partial().parse(req.body);
      const fundHistory = await storage.updatePaymentMethodFundHistory(req.params.id, validatedData);
      if (!fundHistory) {
        return res.status(404).json({ error: "Payment method fund history not found" });
      }
      res.json(fundHistory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error updating payment method fund history:", error);
      res.status(500).json({ error: "Failed to update payment method fund history" });
    }
  });

  // Delete payment method fund history
  app.delete("/api/payment-method-fund-history/:id", async (req, res) => {
    try {
      const success = await storage.deletePaymentMethodFundHistory(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Payment method fund history not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting payment method fund history:", error);
      res.status(500).json({ error: "Failed to delete payment method fund history" });
    }
  });

  // =============== BACKUP & RESTORE ROUTES ===============

  // Backup all data
  app.get("/api/backup", async (req, res) => {
    try {
      const [expenses, categories, fundHistory, paymentMethods, paymentMethodFundHistory] = await Promise.all([
        storage.getAllExpenses(),
        storage.getAllCategories(),
        storage.getAllFundHistory(),
        storage.getAllPaymentMethods(),
        storage.getAllPaymentMethodFundHistory()
      ]);

      const backup = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        data: {
          expenses,
          categories,
          fundHistory,
          paymentMethods,
          paymentMethodFundHistory
        }
      };

      res.json(backup);
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({ error: "Failed to create backup" });
    }
  });

  // Restore data from backup
  app.post("/api/restore", async (req, res) => {
    try {
      const backup = req.body;
      
      if (!backup.data || !backup.version) {
        return res.status(400).json({ error: "Invalid backup file format" });
      }

      // Use a transaction to ensure all-or-nothing restore
      const result = await db.transaction(async (tx) => {
        // Clear existing data
        await tx.delete(expenses);
        await tx.delete(fundHistory);
        await tx.delete(paymentMethodFundHistory);
        await tx.delete(paymentMethods);
        await tx.delete(categories);

        // Build ID mapping for categories
        const categoryIdMap = new Map<string, string>();
        if (backup.data.categories) {
          for (const category of backup.data.categories) {
            const [newCategory] = await tx
              .insert(categories)
              .values({
                name: category.name,
                color: category.color,
                icon: category.icon,
                allocatedFunds: category.allocatedFunds || "0"
              })
              .returning();
            categoryIdMap.set(category.id, newCategory.id);
          }
        }

        // Build ID mapping for payment methods
        const paymentMethodIdMap = new Map<string, string>();
        if (backup.data.paymentMethods) {
          for (const paymentMethod of backup.data.paymentMethods) {
            const [newPaymentMethod] = await tx
              .insert(paymentMethods)
              .values({
                name: paymentMethod.name,
                type: paymentMethod.type,
                balance: paymentMethod.balance || "0",
                maxBalance: paymentMethod.maxBalance || "0",
                creditLimit: paymentMethod.creditLimit,
                dueDate: paymentMethod.dueDate,
                isActive: paymentMethod.isActive ?? true
              })
              .returning();
            paymentMethodIdMap.set(paymentMethod.id, newPaymentMethod.id);
          }
        }

        // Restore expenses with remapped IDs (without balance updates)
        if (backup.data.expenses) {
          for (const expense of backup.data.expenses) {
            const newPaymentMethodId = paymentMethodIdMap.get(expense.paymentMethod);
            await tx.insert(expenses).values({
              amount: expense.amount,
              description: expense.description,
              category: expense.category,
              paymentMethod: newPaymentMethodId || expense.paymentMethod,
              date: new Date(expense.date)
            });
          }
        }

        // Restore fund history with remapped category IDs (without balance updates)
        if (backup.data.fundHistory) {
          for (const history of backup.data.fundHistory) {
            const newCategoryId = categoryIdMap.get(history.categoryId);
            if (newCategoryId) {
              await tx.insert(fundHistory).values({
                categoryId: newCategoryId,
                amount: history.amount,
                description: history.description,
                addedAt: new Date(history.addedAt)
              });
            }
          }
        }

        // Restore payment method fund history with remapped payment method IDs (without balance updates)
        if (backup.data.paymentMethodFundHistory) {
          for (const history of backup.data.paymentMethodFundHistory) {
            const newPaymentMethodId = paymentMethodIdMap.get(history.paymentMethodId);
            if (newPaymentMethodId) {
              await tx.insert(paymentMethodFundHistory).values({
                paymentMethodId: newPaymentMethodId,
                amount: history.amount,
                description: history.description,
                addedAt: new Date(history.addedAt)
              });
            }
          }
        }

        return { success: true };
      });

      res.json({ success: true, message: "Data restored successfully" });
    } catch (error) {
      console.error("Error restoring backup:", error);
      res.status(500).json({ error: "Failed to restore backup" });
    }
  });

  // =============== TELEGRAM BOT SETTINGS ROUTES ===============

  // Get Telegram bot configuration
  app.get("/api/settings/telegram-bot", async (req, res) => {
    try {
      const config = await storage.getTelegramBotConfig();
      if (!config) {
        return res.json({
          isEnabled: false,
          botToken: null,
          webhookSecret: null,
          chatWhitelist: []
        });
      }
      res.json(config);
    } catch (error) {
      console.error("Error fetching Telegram bot config:", error);
      res.status(500).json({ error: "Failed to fetch Telegram bot configuration" });
    }
  });

  // Create or update Telegram bot configuration
  app.put("/api/settings/telegram-bot", async (req, res) => {
    try {
      const validatedData = insertTelegramBotConfigSchema.parse(req.body);
      const config = await storage.createOrUpdateTelegramBotConfig(validatedData);
      
      // Restart the bot with new configuration
      await restartTelegramBot(storage);
      
      res.json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error updating Telegram bot config:", error);
      res.status(500).json({ error: "Failed to update Telegram bot configuration" });
    }
  });

  // Delete Telegram bot configuration
  app.delete("/api/settings/telegram-bot", async (req, res) => {
    try {
      const success = await storage.deleteTelegramBotConfig();
      if (!success) {
        return res.status(404).json({ error: "Telegram bot configuration not found" });
      }
      
      // Stop the bot when configuration is deleted
      await restartTelegramBot(storage);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting Telegram bot config:", error);
      res.status(500).json({ error: "Failed to delete Telegram bot configuration" });
    }
  });

  // =============== TELEGRAM WEBHOOK ENDPOINT ===============

  // Telegram webhook to receive expense commands
  app.post("/api/integrations/telegram/webhook", async (req, res) => {
    try {
      const config = await storage.getTelegramBotConfig();
      
      if (!config || !config.isEnabled) {
        return res.status(403).json({ error: "Telegram bot is not enabled" });
      }

      const secretToken = req.headers['x-telegram-bot-api-secret-token'];
      if (config.webhookSecret && secretToken !== config.webhookSecret) {
        return res.status(403).json({ error: "Invalid webhook secret" });
      }

      const update = req.body;
      
      if (!update.message || !update.message.text) {
        return res.status(200).send("OK");
      }

      const chatId = update.message.chat.id.toString();
      const chatWhitelist = config.chatWhitelist || [];
      
      if (chatWhitelist.length > 0 && !chatWhitelist.includes(chatId)) {
        return res.status(403).json({ error: "Chat not authorized" });
      }

      const text = update.message.text.trim();
      
      // Handle /start command
      if (text === '/start') {
        await sendTelegramMessage(
          chatId,
          'Welcome to Expense Tracker Bot! 🎉\n\n' +
          'Use /expense to add a new expense:\n' +
          '/expense <amount> <description> @<category> #<payment-method>\n\n' +
          'Example:\n' +
          '/expense 50.5 Lunch at cafe @Food & Dining #Cash\n\n' +
          'Your chat ID: ' + chatId
        );
        return res.status(200).send("OK");
      }
      
      // Handle /help command
      if (text === '/help') {
        await sendTelegramMessage(
          chatId,
          'Expense Tracker Bot Commands:\n\n' +
          '📝 /expense - Add a new expense\n' +
          'Format: /expense <amount> <description> @<category> #<payment-method>\n\n' +
          'Example:\n' +
          '/expense 50.5 Lunch at cafe @Food & Dining #Cash\n\n' +
          '💡 Tips:\n' +
          '• Amount must be a positive number\n' +
          '• Category must exist in your system\n' +
          '• Payment method must exist\n' +
          '• If no category is specified, "Other" will be used\n\n' +
          'Your chat ID: ' + chatId
        );
        return res.status(200).send("OK");
      }
      
      if (!text.startsWith('/expense')) {
        return res.status(200).send("OK");
      }

      const expenseCommand = text.substring(8).trim();
      
      const amountMatch = expenseCommand.match(/^(\d+(?:\.\d+)?)\s+(.+)/);
      if (!amountMatch) {
        await sendTelegramMessage(
          chatId,
          '❌ Invalid format.\n\n' +
          'Use: /expense <amount> <description> @<category> #<payment-method>\n\n' +
          'Example:\n' +
          '/expense 50.5 Lunch at cafe @Food & Dining #Cash'
        );
        return res.status(200).send("OK");
      }

      const amount = parseFloat(amountMatch[1]);
      if (isNaN(amount) || amount <= 0) {
        await sendTelegramMessage(chatId, '❌ Invalid amount. Please provide a positive number.');
        return res.status(200).send("OK");
      }

      const remainder = amountMatch[2];
      
      const categoryMatch = remainder.match(/@([^#]+)/);
      const paymentMethodMatch = remainder.match(/#(.+?)(?=\s[@#]|$)/);
      
      let category = categoryMatch ? categoryMatch[1].trim() : '';
      let paymentMethod = paymentMethodMatch ? paymentMethodMatch[1].trim() : '';
      
      let description = remainder
        .replace(/@[^#]+/, '')
        .replace(/#.+/, '')
        .trim();

      if (!description) {
        await sendTelegramMessage(chatId, '❌ Description is required.');
        return res.status(200).send("OK");
      }

      if (!category) {
        category = 'Other';
      }

      const existingCategory = await storage.getCategoryByName(category);
      if (!existingCategory) {
        const categories = await storage.getAllCategories();
        const categoryNames = categories.map(c => c.name).join(', ');
        await sendTelegramMessage(
          chatId,
          `❌ Category '${category}' not found.\n\nAvailable categories:\n${categoryNames}`
        );
        return res.status(200).send("OK");
      }

      let paymentMethodName = '';
      if (paymentMethod) {
        const paymentMethods = await storage.getAllPaymentMethods();
        const existingMethod = paymentMethods.find(pm => pm.name === paymentMethod);
        if (!existingMethod) {
          const methodNames = paymentMethods.map(pm => pm.name).join(', ');
          await sendTelegramMessage(
            chatId,
            `❌ Payment method '${paymentMethod}' not found.\n\nAvailable payment methods:\n${methodNames}`
          );
          return res.status(200).send("OK");
        }
        paymentMethodName = paymentMethod;
        paymentMethod = existingMethod.id;
      }

      if (!paymentMethod) {
        await sendTelegramMessage(chatId, '❌ Payment method is required. Use #<payment-method>');
        return res.status(200).send("OK");
      }

      const expenseData = {
        amount,
        description,
        category: category,
        paymentMethod: paymentMethod,
        date: new Date()
      };

      const validatedData = insertExpenseSchema.parse(expenseData);
      const expense = await storage.createExpense(validatedData);

      await sendTelegramMessage(
        chatId,
        `✅ Expense added successfully!\n\n` +
        `💰 Amount: AED ${amount.toFixed(2)}\n` +
        `📝 Description: ${description}\n` +
        `📂 Category: ${category}\n` +
        `💳 Payment: ${paymentMethodName}`
      );

      res.status(200).send("OK");
    } catch (error) {
      console.error("Error processing Telegram webhook:", error);
      const chatId = req.body?.message?.chat?.id;
      if (chatId) {
        await sendTelegramMessage(chatId, '❌ Failed to add expense. Please try again.');
      }
      res.status(200).send("OK");
    }
  });

  const httpServer = createServer(app);

  // Initialize Telegram bot on server start
  await initializeTelegramBot(storage);

  return httpServer;
}

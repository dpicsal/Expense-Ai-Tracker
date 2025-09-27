import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertExpenseSchema, insertCategorySchema, 
  insertFundHistorySchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all expenses
  app.get("/api/expenses", async (req, res) => {
    try {
      const expenses = await storage.getAllExpenses();
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

  const httpServer = createServer(app);

  return httpServer;
}

import { GoogleGenAI } from "@google/genai";
import type { IStorage } from './storage';
import type { InsertExpense } from "@shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface ExpenseIntent {
  action: 'add_expense' | 'view_expenses' | 'view_summary' | 'delete_expense' | 'view_categories' | 'set_budget' | 'help' | 'unknown';
  amount?: number;
  category?: string;
  description?: string;
  date?: string;
  budgetAmount?: number;
  startDate?: string;
  endDate?: string;
}

export async function processWhatsAppMessage(message: string, storage: IStorage, imageUrl?: string): Promise<string> {
  try {
    if (imageUrl) {
      return await handleReceiptImage(imageUrl, storage);
    }
    
    const intent = await extractIntent(message);
    
    switch (intent.action) {
      case 'add_expense':
        return await handleAddExpense(intent, storage);
      case 'view_expenses':
        return await handleViewExpenses(storage, intent);
      case 'view_summary':
        return await handleViewSummary(storage, intent);
      case 'delete_expense':
        return await handleDeleteExpense(storage);
      case 'view_categories':
        return await handleViewCategories(storage);
      case 'set_budget':
        return await handleSetBudget(intent, storage);
      case 'help':
        return getHelpMessage();
      default:
        return "I didn't understand that. Send 'help' to see what I can do!";
    }
  } catch (error) {
    console.error('[WhatsApp AI] Error processing message:', error);
    return "Sorry, I encountered an error processing your request. Please try again.";
  }
}

async function extractIntent(message: string): Promise<ExpenseIntent> {
  const systemPrompt = `You are an expense tracking assistant for WhatsApp. 
Analyze user messages and extract their intent and expense details.

Possible actions:
- add_expense: User wants to add/record an expense
- view_expenses: User wants to see their recent expenses
- view_summary: User wants to see a summary or report
- delete_expense: User wants to delete the last expense
- view_categories: User wants to see all categories
- set_budget: User wants to set a budget for a category
- help: User needs help or instructions
- unknown: Cannot determine intent

For add_expense, extract:
- amount: numeric value (required)
- category: expense category like Food, Transport, Shopping, Bills, Entertainment, Health, etc.
- description: what the expense was for

Return JSON only.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          action: { 
            type: "string",
            enum: ["add_expense", "view_expenses", "view_summary", "delete_expense", "view_categories", "set_budget", "help", "unknown"]
          },
          amount: { type: "number" },
          category: { type: "string" },
          description: { type: "string" },
          date: { type: "string" },
          budgetAmount: { type: "number" },
          startDate: { type: "string" },
          endDate: { type: "string" }
        },
        required: ["action"]
      }
    },
    contents: message
  });

  const rawJson = response.text;
  if (rawJson) {
    return JSON.parse(rawJson) as ExpenseIntent;
  }
  
  return { action: 'unknown' };
}

async function handleAddExpense(intent: ExpenseIntent, storage: IStorage): Promise<string> {
  if (!intent.amount) {
    return "I couldn't find an amount in your message. Please specify how much you spent.\n\nExample: 'I spent $50 on groceries'";
  }

  const categoryName = intent.category || 'Uncategorized';
  let category = await storage.getCategoryByName(categoryName);
  
  if (!category) {
    category = await storage.createCategory({
      name: categoryName,
      color: 'bg-gray-500',
      icon: 'Tag',
      allocatedFunds: 0
    });
  }

  const expense: InsertExpense = {
    amount: intent.amount,
    category: categoryName,
    paymentMethod: 'WhatsApp',
    description: intent.description || 'WhatsApp expense',
    date: intent.date ? new Date(intent.date) : new Date()
  };

  const created = await storage.createExpense(expense);

  let response = `✅ Expense added!\n\n`;
  response += `💰 Amount: $${intent.amount.toFixed(2)}\n`;
  response += `📁 Category: ${categoryName}\n`;
  if (intent.description) {
    response += `📝 Note: ${intent.description}\n`;
  }
  
  if (category.budget && parseFloat(category.budget) > 0) {
    const categoryExpenses = await storage.getAllExpenses();
    const categoryTotal = categoryExpenses
      .filter(e => e.category === categoryName)
      .reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);
    
    const budgetLimit = parseFloat(category.budget);
    const percentage = (categoryTotal / budgetLimit) * 100;
    response += `\n📊 ${categoryName} Budget: $${categoryTotal.toFixed(2)} / $${budgetLimit.toFixed(2)} (${percentage.toFixed(0)}%)`;
    
    if (percentage >= 100) {
      response += `\n⚠️ Budget exceeded!`;
    } else if (percentage >= 80) {
      response += `\n⚠️ Near budget limit!`;
    }
  }

  return response;
}

async function handleViewExpenses(storage: IStorage, intent: ExpenseIntent): Promise<string> {
  const today = new Date();
  let startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let endDate = today;
  
  if (intent.startDate) {
    startDate = new Date(intent.startDate);
  }
  if (intent.endDate) {
    endDate = new Date(intent.endDate);
  }
  
  const expenses = await storage.getAllExpenses(startDate, endDate);
  
  if (expenses.length === 0) {
    return "📭 No expenses recorded this month.";
  }

  let response = `📊 Recent Expenses (${expenses.length} total)\n\n`;
  
  const recentExpenses = expenses.slice(0, 10);
  for (const expense of recentExpenses) {
    const date = new Date(expense.date).toLocaleDateString();
    response += `• $${parseFloat(expense.amount.toString()).toFixed(2)} - ${expense.category}\n`;
    if (expense.description && expense.description !== 'WhatsApp expense') {
      response += `  ${expense.description}\n`;
    }
    response += `  ${date}\n\n`;
  }
  
  if (expenses.length > 10) {
    response += `\n(Showing 10 of ${expenses.length} expenses)`;
  }

  return response;
}

async function handleViewSummary(storage: IStorage, intent: ExpenseIntent): Promise<string> {
  const today = new Date();
  let startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let endDate = today;
  
  if (intent.startDate) {
    startDate = new Date(intent.startDate);
  }
  if (intent.endDate) {
    endDate = new Date(intent.endDate);
  }
  
  const expenses = await storage.getAllExpenses(startDate, endDate);
  
  const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);
  
  const categoryTotals = new Map<string, number>();
  for (const expense of expenses) {
    const categoryName = expense.category;
    categoryTotals.set(
      categoryName,
      (categoryTotals.get(categoryName) || 0) + parseFloat(expense.amount.toString())
    );
  }

  let response = `📈 Monthly Summary\n\n`;
  response += `💰 Total Spent: $${total.toFixed(2)}\n`;
  response += `📝 Total Expenses: ${expenses.length}\n\n`;
  
  if (categoryTotals.size > 0) {
    response += `📁 By Category:\n`;
    const sorted = Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1]);
    for (const [category, amount] of sorted) {
      const percentage = (amount / total) * 100;
      response += `• ${category}: $${amount.toFixed(2)} (${percentage.toFixed(0)}%)\n`;
    }
  }

  response += `\n📅 Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

  return response;
}

async function handleDeleteExpense(storage: IStorage): Promise<string> {
  const today = new Date();
  const expenses = await storage.getAllExpenses();
  
  if (expenses.length === 0) {
    return "❌ No expenses to delete.";
  }

  const lastExpense = expenses[0];
  const success = await storage.deleteExpense(lastExpense.id);
  
  if (success) {
    return `✅ Deleted expense:\n💰 $${parseFloat(lastExpense.amount.toString()).toFixed(2)} - ${lastExpense.category}\n📝 ${lastExpense.description}`;
  }
  
  return "❌ Failed to delete expense.";
}

async function handleViewCategories(storage: IStorage): Promise<string> {
  const categories = await storage.getAllCategories();
  const expenses = await storage.getAllExpenses();
  
  if (categories.length === 0) {
    return "📂 No categories yet. Add an expense to create categories!";
  }

  let response = `📂 Your Categories (${categories.length})\n\n`;
  
  for (const category of categories) {
    const categoryExpenses = expenses.filter(e => e.category === category.name);
    const total = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);
    
    response += `• ${category.name}\n`;
    response += `  💰 Spent: $${total.toFixed(2)}`;
    
    if (category.budget && parseFloat(category.budget) > 0) {
      const budget = parseFloat(category.budget);
      const percentage = (total / budget) * 100;
      response += ` / $${budget.toFixed(2)} (${percentage.toFixed(0)}%)`;
      
      if (percentage >= 100) {
        response += ` ⚠️`;
      }
    }
    response += `\n`;
  }

  return response;
}

async function handleSetBudget(intent: ExpenseIntent, storage: IStorage): Promise<string> {
  if (!intent.category || !intent.budgetAmount) {
    return "❌ Please specify both category and budget amount.\n\nExample: 'Set $500 budget for groceries'";
  }

  let category = await storage.getCategoryByName(intent.category);
  
  if (!category) {
    return `❌ Category "${intent.category}" not found. Create it by adding an expense first!`;
  }

  await storage.updateCategory(category.id, { budget: intent.budgetAmount.toString() });
  
  return `✅ Budget set!\n📁 ${intent.category}: $${intent.budgetAmount.toFixed(2)}`;
}

function getHelpMessage(): string {
  return `🤖 *WhatsApp Expense Tracker*

*💰 Add Expenses:*
• "I spent $50 on groceries"
• "Lunch $25"
• "$100 for bills yesterday"
• "Paid $30 for gas"

*📊 View & Analyze:*
• "Show expenses" - Recent expenses
• "Summary" - Monthly breakdown
• "Categories" - All categories & budgets
• "Expenses this week" - Weekly view

*🎯 Manage:*
• "Delete last expense" - Remove latest
• "Set $500 budget for groceries"
• "Set $200 budget for food"

*📅 Date Ranges:*
• "Expenses last week"
• "Summary this month"
• "Show expenses from Jan 1 to Jan 31"

*💡 Smart Features:*
✓ Auto-categorization (Food, Transport, Shopping, Bills, etc.)
✓ Budget tracking & alerts
✓ Natural language understanding
✓ Multi-currency support

Just chat naturally - I'll understand! 🚀

*📸 Receipt Scanning:*
Send a photo of your receipt and I'll extract the expense details automatically!`;
}

async function handleReceiptImage(imageUrl: string, storage: IStorage): Promise<string> {
  try {
    const systemPrompt = `Analyze this receipt image and extract expense details.
Extract:
- Total amount (the final amount paid)
- Store/merchant name
- Category (Food, Shopping, Transport, Bills, Entertainment, etc.)
- Date (if visible)
- Individual items (optional)

Return JSON format.`;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            amount: { type: "number" },
            merchant: { type: "string" },
            category: { type: "string" },
            date: { type: "string" },
            items: { 
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["amount", "merchant", "category"]
        }
      },
      contents: [
        {
          inlineData: {
            data: imageUrl,
            mimeType: "image/jpeg"
          }
        },
        "Extract expense details from this receipt"
      ]
    });

    const rawJson = aiResponse.text;
    if (!rawJson) {
      return "❌ Could not read the receipt. Please make sure the image is clear.";
    }

    const receiptData = JSON.parse(rawJson);
    
    if (!receiptData.amount || receiptData.amount <= 0) {
      return "❌ Could not find a valid amount in the receipt. Please try again or enter manually.";
    }

    const categoryName = receiptData.category || 'Uncategorized';
    let category = await storage.getCategoryByName(categoryName);
    
    if (!category) {
      category = await storage.createCategory({
        name: categoryName,
        color: 'bg-gray-500',
        icon: 'Tag',
        allocatedFunds: 0
      });
    }

    const expense: InsertExpense = {
      amount: receiptData.amount,
      category: categoryName,
      paymentMethod: 'WhatsApp',
      description: `${receiptData.merchant}${receiptData.items?.length ? ' - ' + receiptData.items.slice(0, 3).join(', ') : ''}`,
      date: receiptData.date ? new Date(receiptData.date) : new Date()
    };

    await storage.createExpense(expense);

    let responseText = `📸 *Receipt Scanned!*\n\n`;
    responseText += `✅ Expense Added:\n`;
    responseText += `💰 Amount: $${receiptData.amount.toFixed(2)}\n`;
    responseText += `🏪 Merchant: ${receiptData.merchant}\n`;
    responseText += `📁 Category: ${categoryName}\n`;
    
    if (receiptData.items && receiptData.items.length > 0) {
      responseText += `\n📝 Items:\n`;
      receiptData.items.slice(0, 5).forEach((item: string) => {
        responseText += `  • ${item}\n`;
      });
      if (receiptData.items.length > 5) {
        responseText += `  ... and ${receiptData.items.length - 5} more\n`;
      }
    }

    return responseText;
  } catch (error) {
    console.error('[WhatsApp AI] Error processing receipt:', error);
    return "❌ Failed to process receipt image. Please try again or enter the expense manually.";
  }
}

import { GoogleGenAI } from "@google/genai";
import type { IStorage } from './storage';
import type { InsertExpense } from "@shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface ExpenseIntent {
  action: 'add_expense' | 'view_expenses' | 'view_summary' | 'help' | 'unknown';
  amount?: number;
  category?: string;
  description?: string;
  date?: string;
}

export async function processWhatsAppMessage(message: string, storage: IStorage): Promise<string> {
  try {
    const intent = await extractIntent(message);
    
    switch (intent.action) {
      case 'add_expense':
        return await handleAddExpense(intent, storage);
      case 'view_expenses':
        return await handleViewExpenses(storage);
      case 'view_summary':
        return await handleViewSummary(storage);
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
            enum: ["add_expense", "view_expenses", "view_summary", "help", "unknown"]
          },
          amount: { type: "number" },
          category: { type: "string" },
          description: { type: "string" },
          date: { type: "string" }
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

async function handleViewExpenses(storage: IStorage): Promise<string> {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const expenses = await storage.getAllExpenses(startOfMonth, today);
  
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

async function handleViewSummary(storage: IStorage): Promise<string> {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const expenses = await storage.getAllExpenses(startOfMonth, today);
  
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

  response += `\n📅 Period: ${startOfMonth.toLocaleDateString()} - ${today.toLocaleDateString()}`;

  return response;
}

function getHelpMessage(): string {
  return `🤖 WhatsApp Expense Tracker

I can help you track expenses using natural language!

📝 Add Expenses:
• "I spent $50 on groceries"
• "Add expense: lunch $25"
• "$100 for bills"
• "Paid $30 for gas"

📊 View Data:
• "Show expenses" - Recent expenses
• "Summary" - Monthly summary
• "Report" - Detailed breakdown

💡 Tips:
• I'll automatically categorize expenses
• Categories: Food, Transport, Shopping, Bills, Entertainment, Health, etc.
• All amounts are tracked monthly

Send me a message to get started!`;
}

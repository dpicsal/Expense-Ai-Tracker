import { GoogleGenAI } from "@google/genai";
import type { IStorage } from './storage';
import type { InsertExpense, InsertPaymentMethod, InsertCategory } from "@shared/schema";

async function getGeminiAI(storage: IStorage): Promise<GoogleGenAI | null> {
  const config = await storage.getGeminiConfig();
  
  if (config) {
    if (!config.isEnabled) {
      console.log('[WhatsApp AI] Gemini AI is disabled in settings');
      return null;
    }
    
    if (!config.apiKey) {
      console.error('[WhatsApp AI] Gemini AI is enabled but no API key configured in settings');
      return null;
    }
    
    return new GoogleGenAI({ apiKey: config.apiKey });
  }
  
  const envApiKey = process.env.GEMINI_API_KEY;
  if (!envApiKey) {
    console.warn('[WhatsApp AI] No Gemini config found and GEMINI_API_KEY environment variable not set');
    return null;
  }
  
  return new GoogleGenAI({ apiKey: envApiKey });
}

interface Intent {
  action: 'add_expense' | 'view_expenses' | 'view_summary' | 'delete_expense' | 
          'view_categories' | 'create_category' | 'update_category' | 'delete_category' |
          'set_budget' | 'add_funds_to_category' | 'reset_category' |
          'view_payment_methods' | 'create_payment_method' | 'update_payment_method' | 
          'delete_payment_method' | 'add_funds_to_payment_method' | 'pay_credit_card' |
          'view_analytics' | 'export_data' | 'backup_data' | 'help' | 'greeting' | 'menu' | 
          'confirm_action' | 'cancel_action' | 'unknown';
  
  amount?: number;
  category?: string;
  description?: string;
  date?: string;
  paymentMethod?: string;
  
  budgetAmount?: number;
  allocatedFunds?: number;
  
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
  
  paymentMethodName?: string;
  paymentMethodType?: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet';
  creditLimit?: number;
  dueDate?: number;
  
  fromPaymentMethod?: string;
  toPaymentMethod?: string;
  
  startDate?: string;
  endDate?: string;
  period?: string;
}

export async function processWhatsAppMessage(message: string, storage: IStorage, imageUrl?: string, userId?: string): Promise<string> {
  try {
    if (imageUrl) {
      return await handleReceiptImage(imageUrl, storage);
    }
    
    const lowerMessage = message.toLowerCase().trim();
    
    if (lowerMessage === 'add_expense_guide') {
      return "💰 *Add an Expense*\n\nJust tell me naturally!\n\n✅ Examples:\n• 'Spent 50 AED on groceries'\n• 'Paid 100 for lunch with Chase card'\n• 'Food 25 AED yesterday'\n\n💡 I'll auto-detect the amount, category, and payment method!";
    }
    
    if (lowerMessage === 'create_category_guide') {
      return "📁 *Create a Category*\n\nExamples:\n• 'Create category Food'\n• 'Add category Transport with 500 budget'\n\n💡 You can set budgets and allocate funds too!";
    }
    
    if (lowerMessage === 'set_budget_guide') {
      return "📊 *Set Category Budget*\n\nExamples:\n• 'Set 500 AED budget for Food'\n• 'Food budget 1000'\n\n💡 I'll track your spending and alert you!";
    }
    
    if (lowerMessage === 'add_funds_category_guide') {
      return "💵 *Add Funds to Category*\n\nExamples:\n• 'Add 500 AED to Food'\n• 'Allocate 200 to Transport'\n\n💡 Track allocated vs spent funds!";
    }
    
    if (lowerMessage === 'create_payment_guide') {
      return "💳 *Create Payment Method*\n\nExamples:\n• 'Create credit card Chase'\n• 'Add cash wallet with 200 AED'\n• 'Create Chase credit card with 5000 limit'\n\n💡 Track balances and credit limits!";
    }
    
    if (lowerMessage === 'add_funds_payment_guide') {
      return "💵 *Add Funds to Payment Method*\n\nExamples:\n• 'Add 500 AED to Chase'\n• 'Deposit 200 to my wallet'\n\n💡 Keep your balances up to date!";
    }
    
    if (lowerMessage === 'category_menu' || lowerMessage === 'payment_menu') {
      return "📋 *Menu Options*\n\nTap the button below to see the full menu!";
    }
    
    const userState = userId ? await storage.getWhatsappUserState(userId) : null;
    
    if (userState?.state === 'awaiting_confirmation') {
      const intent = await extractIntent(message, storage);
      
      if (intent.action === 'confirm_action' || lowerMessage.includes('yes') || lowerMessage.includes('confirm') || lowerMessage.includes('proceed')) {
        const pendingAction = JSON.parse(userState.data || '{}');
        await storage.clearWhatsappUserState(userId!);
        return await executePendingAction(pendingAction, storage);
      } else if (intent.action === 'cancel_action' || lowerMessage.includes('no') || lowerMessage.includes('cancel')) {
        await storage.clearWhatsappUserState(userId!);
        return "✅ Action cancelled. What else can I help you with?";
      }
    }
    
    const intent = await extractIntent(message, storage);
    
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
      case 'create_category':
        return await handleCreateCategory(intent, storage);
      case 'update_category':
        return await handleUpdateCategory(intent, storage);
      case 'delete_category':
        return await handleDeleteCategory(intent, storage);
      case 'set_budget':
        return await handleSetBudget(intent, storage);
      case 'add_funds_to_category':
        return await handleAddFundsToCategory(intent, storage);
      case 'reset_category':
        return await handleResetCategory(intent, storage);
      
      case 'view_payment_methods':
        return await handleViewPaymentMethods(storage);
      case 'create_payment_method':
        return await handleCreatePaymentMethod(intent, storage);
      case 'update_payment_method':
        return await handleUpdatePaymentMethod(intent, storage);
      case 'delete_payment_method':
        return await handleDeletePaymentMethod(intent, storage);
      case 'add_funds_to_payment_method':
        return await handleAddFundsToPaymentMethod(intent, storage);
      case 'pay_credit_card':
        return await handlePayCreditCard(intent, storage);
      
      case 'view_analytics':
        return await handleViewAnalytics(storage, intent);
      case 'export_data':
      case 'backup_data':
        return await handleExportData(storage);
      
      case 'help':
        return getHelpMessage();
      case 'greeting':
        return getGreetingResponse();
      case 'menu':
        return "📋 *Main Menu*\n\nTap the button below to see all available options, or just type what you need!";
      default:
        return getConversationalUnknownResponse(message);
    }
  } catch (error) {
    console.error('[WhatsApp AI] Error processing message:', error);
    return "Sorry, I encountered an error processing your request. Please try again.";
  }
}

async function extractIntent(message: string, storage: IStorage): Promise<Intent> {
  const systemPrompt = `You are an intelligent expense tracking assistant with comprehensive financial management capabilities.

Analyze user messages and extract their intent with high precision. Be context-aware, understand natural language variations, and infer the user's goal.

**CONVERSATIONAL INTENTS:**
- greeting: "hello", "hi", "hey", "good morning", "how are you", "what's up"
- menu: "menu", "show options", "what can you do", "help menu", "commands"
- help: "help", "guide", "how to", "tutorial", "instructions"
- confirm_action: "yes", "confirm", "proceed", "ok", "sure", "do it", "go ahead"
- cancel_action: "no", "cancel", "stop", "nevermind", "don't do it"

**EXPENSE MANAGEMENT:**
- add_expense: "spent 50 AED on food", "paid 100 for lunch", "groceries 75 AED", "bought coffee 15", "dinner was 200 yesterday"
- view_expenses: "show expenses", "list spending", "what did I spend", "my expenses", "expense history"
- view_summary: "summary", "monthly report", "spending breakdown", "how much did I spend", "total expenses"
- delete_expense: "delete last expense", "remove last one", "undo", "cancel last entry"

**CATEGORY MANAGEMENT:**
- view_categories: "show categories", "list categories", "my categories", "category list"
- create_category: "create category Food", "add category Transport", "new category Shopping"
- update_category: "rename Food to Groceries", "change Food budget to 500", "update Transport budget"
- delete_category: "delete category Food", "remove category Transport"
- set_budget: "set 500 AED budget for Food", "Food budget 500", "budget 1000 for Shopping"
- add_funds_to_category: "add 200 AED to Food", "allocate 100 to Transport", "fund category Shopping 500"
- reset_category: "reset category Food", "clear Food expenses", "restart category Transport"

**PAYMENT METHOD MANAGEMENT:**
- view_payment_methods: "show payment methods", "list cards", "my wallets", "payment accounts"
- create_payment_method: "add credit card Chase", "create cash wallet", "new debit card ADCB with 1000 balance"
- update_payment_method: "update Chase limit to 5000", "change cash balance to 500"
- delete_payment_method: "delete Chase card", "remove cash wallet"
- add_funds_to_payment_method: "add 500 AED to Chase", "deposit 200 to wallet", "top up debit card 1000"
- pay_credit_card: "pay credit card", "pay Chase 500", "clear credit card balance", "settle Chase card with cash"

**ANALYTICS & DATA MANAGEMENT:**
- view_analytics: "show analytics", "spending trends", "charts", "monthly analysis", "category breakdown"
- export_data: "export data", "download expenses", "send report"
- backup_data: "backup", "save data", "create backup", "download backup"

**SMART EXTRACTION RULES:**
1. For expenses: extract amount, category, description, date, paymentMethod
   - Examples: "spent 50 on food" → amount=50, category="Food"
   - "paid 100 for groceries with Chase" → amount=100, category="Groceries", paymentMethod="Chase"

2. For categories: extract categoryName, budgetAmount, allocatedFunds, categoryColor, categoryIcon
   - Examples: "create Food with 500 budget" → categoryName="Food", budgetAmount=500

3. For payment methods: extract paymentMethodName, paymentMethodType, creditLimit, dueDate, amount
   - Examples: "add Chase credit card 5000 limit" → paymentMethodName="Chase", paymentMethodType="credit_card", creditLimit=5000

4. For credit card payments: extract amount, toPaymentMethod (credit card), fromPaymentMethod (source)
   - Examples: "pay Chase 500 from cash" → amount=500, toPaymentMethod="Chase", fromPaymentMethod="cash"

5. For date ranges: extract startDate, endDate, period
   - Examples: "expenses last week" → period="last_week"

**CONTEXT AWARENESS:**
- "add 500 to Food" → if Food is a category, use add_funds_to_category; if payment method, use add_funds_to_payment_method
- "pay 500" → check if there's a credit card context, use pay_credit_card
- "reset Food" → use reset_category to clear expenses but keep category
- "clear expenses" → if category specified, use reset_category; otherwise ask for clarification

Return JSON only with the extracted intent and parameters.`;

  const ai = await getGeminiAI(storage);
  if (!ai) {
    console.error('[WhatsApp AI] Failed to get Gemini AI instance in extractIntent');
    return { action: 'unknown' };
  }

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
            enum: [
              "add_expense", "view_expenses", "view_summary", "delete_expense",
              "view_categories", "create_category", "update_category", "delete_category",
              "set_budget", "add_funds_to_category", "reset_category",
              "view_payment_methods", "create_payment_method", "update_payment_method", 
              "delete_payment_method", "add_funds_to_payment_method", "pay_credit_card",
              "view_analytics", "export_data", "backup_data", "help", "greeting", "menu", "unknown"
            ]
          },
          amount: { type: "number" },
          category: { type: "string" },
          description: { type: "string" },
          date: { type: "string" },
          paymentMethod: { type: "string" },
          budgetAmount: { type: "number" },
          allocatedFunds: { type: "number" },
          categoryName: { type: "string" },
          categoryColor: { type: "string" },
          categoryIcon: { type: "string" },
          paymentMethodName: { type: "string" },
          paymentMethodType: { type: "string", enum: ["cash", "credit_card", "debit_card", "bank_transfer", "digital_wallet"] },
          creditLimit: { type: "number" },
          dueDate: { type: "number" },
          fromPaymentMethod: { type: "string" },
          toPaymentMethod: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
          period: { type: "string" }
        },
        required: ["action"]
      }
    },
    contents: message
  });

  const rawJson = response.text;
  if (rawJson) {
    return JSON.parse(rawJson) as Intent;
  }
  
  return { action: 'unknown' };
}

// ============= EXPENSE HANDLERS =============

async function handleAddExpense(intent: Intent, storage: IStorage): Promise<string> {
  if (!intent.amount) {
    return "❌ I couldn't find an amount. Please specify how much you spent.\n\n💡 Example: 'I spent 50 AED on groceries'";
  }

  const categoryName = intent.category || 'Uncategorized';
  let category = await storage.getCategoryByName(categoryName);
  
  if (!category) {
    category = await storage.createCategory({
      name: categoryName,
      color: 'bg-blue-500',
      icon: 'Tag',
      allocatedFunds: 0
    });
  }

  const paymentMethodName = intent.paymentMethod || 'WhatsApp';
  let paymentMethod = await storage.getPaymentMethodByName(paymentMethodName);
  
  if (!paymentMethod && paymentMethodName !== 'WhatsApp') {
    return `❌ Payment method "${paymentMethodName}" not found. Please create it first or I'll use WhatsApp as default.`;
  }

  const expense: InsertExpense = {
    amount: intent.amount,
    category: categoryName,
    paymentMethod: paymentMethodName,
    description: intent.description || 'WhatsApp expense',
    date: intent.date ? new Date(intent.date) : new Date()
  };

  await storage.createExpense(expense);

  let response = `✅ Expense Added Successfully!\n\n`;
  response += `💰 Amount: AED ${intent.amount.toFixed(2)}\n`;
  response += `📁 Category: ${categoryName}\n`;
  response += `💳 Payment: ${paymentMethodName}\n`;
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
    response += `\n📊 ${categoryName} Budget: AED ${categoryTotal.toFixed(2)} / AED ${budgetLimit.toFixed(2)} (${percentage.toFixed(0)}%)`;
    
    if (percentage >= 100) {
      response += `\n⚠️ BUDGET EXCEEDED!`;
    } else if (percentage >= 80) {
      response += `\n⚠️ Near budget limit!`;
    }
  }

  return response;
}

async function handleViewExpenses(storage: IStorage, intent: Intent): Promise<string> {
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
    return "📭 No expenses recorded for this period.";
  }

  let response = `📊 Expenses (${expenses.length} total)\n\n`;
  
  const recentExpenses = expenses.slice(0, 15);
  for (const expense of recentExpenses) {
    const expDate = new Date(expense.date);
    const date = `${expDate.getDate().toString().padStart(2, '0')}/${(expDate.getMonth() + 1).toString().padStart(2, '0')}/${expDate.getFullYear()}`;
    response += `💰 AED ${parseFloat(expense.amount.toString()).toFixed(2)}\n`;
    response += `📁 ${expense.category} | 💳 ${expense.paymentMethod}\n`;
    if (expense.description && expense.description !== 'WhatsApp expense') {
      response += `📝 ${expense.description}\n`;
    }
    response += `📅 ${date}\n\n`;
  }
  
  if (expenses.length > 15) {
    response += `... and ${expenses.length - 15} more\n\n`;
  }

  const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);
  response += `💵 Total: AED ${total.toFixed(2)}`;

  return response;
}

async function handleViewSummary(storage: IStorage, intent: Intent): Promise<string> {
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
  const paymentMethodTotals = new Map<string, number>();
  
  for (const expense of expenses) {
    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) || 0) + parseFloat(expense.amount.toString())
    );
    paymentMethodTotals.set(
      expense.paymentMethod,
      (paymentMethodTotals.get(expense.paymentMethod) || 0) + parseFloat(expense.amount.toString())
    );
  }

  let response = `📈 *Spending Summary*\n\n`;
  response += `💰 Total Spent: AED ${total.toFixed(2)}\n`;
  response += `📝 Total Expenses: ${expenses.length}\n`;
  const formattedStartDate = `${startDate.getDate().toString().padStart(2, '0')}/${(startDate.getMonth() + 1).toString().padStart(2, '0')}/${startDate.getFullYear()}`;
  const formattedEndDate = `${endDate.getDate().toString().padStart(2, '0')}/${(endDate.getMonth() + 1).toString().padStart(2, '0')}/${endDate.getFullYear()}`;
  response += `📅 Period: ${formattedStartDate} - ${formattedEndDate}\n\n`;
  
  if (categoryTotals.size > 0) {
    response += `📁 *By Category:*\n`;
    const sorted = Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1]);
    for (const [category, amount] of sorted.slice(0, 8)) {
      const percentage = (amount / total) * 100;
      response += `• ${category}: AED ${amount.toFixed(2)} (${percentage.toFixed(0)}%)\n`;
    }
    response += `\n`;
  }
  
  if (paymentMethodTotals.size > 0) {
    response += `💳 *By Payment Method:*\n`;
    const sorted = Array.from(paymentMethodTotals.entries()).sort((a, b) => b[1] - a[1]);
    for (const [method, amount] of sorted) {
      const percentage = (amount / total) * 100;
      response += `• ${method}: AED ${amount.toFixed(2)} (${percentage.toFixed(0)}%)\n`;
    }
  }

  return response;
}

async function handleDeleteExpense(storage: IStorage): Promise<string> {
  const expenses = await storage.getAllExpenses();
  
  if (expenses.length === 0) {
    return "❌ No expenses to delete.";
  }

  const lastExpense = expenses[0];
  const success = await storage.deleteExpense(lastExpense.id);
  
  if (success) {
    return `✅ Deleted expense:\n💰 AED ${parseFloat(lastExpense.amount.toString()).toFixed(2)}\n📁 ${lastExpense.category}\n📝 ${lastExpense.description}`;
  }
  
  return "❌ Failed to delete expense.";
}

// ============= CATEGORY HANDLERS =============

async function handleViewCategories(storage: IStorage): Promise<string> {
  const categories = await storage.getAllCategories();
  const expenses = await storage.getAllExpenses();
  
  if (categories.length === 0) {
    return "📂 No categories yet. Add an expense to auto-create categories!";
  }

  let response = `📂 *Your Categories* (${categories.length})\n\n`;
  
  for (const category of categories) {
    const categoryExpenses = expenses.filter(e => e.category === category.name);
    const total = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);
    const allocated = category.allocatedFunds ? parseFloat(category.allocatedFunds.toString()) : 0;
    
    response += `📁 *${category.name}*\n`;
    response += `💰 Spent: AED ${total.toFixed(2)}`;
    
    if (allocated > 0) {
      const available = allocated - total;
      response += ` | 💵 Available: AED ${available.toFixed(2)}`;
    }
    
    if (category.budget && parseFloat(category.budget) > 0) {
      const budget = parseFloat(category.budget);
      const percentage = (total / budget) * 100;
      response += `\n📊 Budget: AED ${budget.toFixed(2)} (${percentage.toFixed(0)}% used)`;
      
      if (percentage >= 100) {
        response += ` ⚠️`;
      }
    }
    response += `\n\n`;
  }

  return response;
}

async function handleCreateCategory(intent: Intent, storage: IStorage): Promise<string> {
  if (!intent.categoryName) {
    return "❌ Please specify a category name.\n\n💡 Example: 'Create category Food'";
  }

  const existing = await storage.getCategoryByName(intent.categoryName);
  if (existing) {
    return `❌ Category "${intent.categoryName}" already exists!`;
  }

  const category: InsertCategory = {
    name: intent.categoryName,
    color: intent.categoryColor || 'bg-blue-500',
    icon: intent.categoryIcon || 'Tag',
    allocatedFunds: intent.allocatedFunds || 0,
    budget: intent.budgetAmount?.toString()
  };

  await storage.createCategory(category);

  let response = `✅ Category Created!\n\n📁 ${intent.categoryName}`;
  if (intent.budgetAmount) {
    response += `\n📊 Budget: AED ${intent.budgetAmount.toFixed(2)}`;
  }
  if (intent.allocatedFunds) {
    response += `\n💵 Allocated: AED ${intent.allocatedFunds.toFixed(2)}`;
  }

  return response;
}

async function handleUpdateCategory(intent: Intent, storage: IStorage): Promise<string> {
  if (!intent.categoryName) {
    return "❌ Please specify which category to update.\n\n💡 Example: 'Update Food budget to 500'";
  }

  const category = await storage.getCategoryByName(intent.categoryName);
  if (!category) {
    return `❌ Category "${intent.categoryName}" not found.`;
  }

  const updates: Partial<InsertCategory> = {};
  if (intent.budgetAmount !== undefined) {
    updates.budget = intent.budgetAmount.toString();
  }
  if (intent.allocatedFunds !== undefined) {
    updates.allocatedFunds = intent.allocatedFunds;
  }

  await storage.updateCategory(category.id, updates);

  let response = `✅ Category Updated!\n\n📁 ${intent.categoryName}`;
  if (intent.budgetAmount !== undefined) {
    response += `\n📊 New Budget: AED ${intent.budgetAmount.toFixed(2)}`;
  }
  if (intent.allocatedFunds !== undefined) {
    response += `\n💵 Allocated Funds: AED ${intent.allocatedFunds.toFixed(2)}`;
  }

  return response;
}

async function handleDeleteCategory(intent: Intent, storage: IStorage): Promise<string> {
  if (!intent.categoryName) {
    return "❌ Please specify which category to delete.\n\n💡 Example: 'Delete category Food'";
  }

  const category = await storage.getCategoryByName(intent.categoryName);
  if (!category) {
    return `❌ Category "${intent.categoryName}" not found.`;
  }

  await storage.deleteCategory(category.id);
  return `✅ Category "${intent.categoryName}" deleted successfully!`;
}

async function handleSetBudget(intent: Intent, storage: IStorage): Promise<string> {
  if (!intent.category || !intent.budgetAmount) {
    return "❌ Please specify category and budget amount.\n\n💡 Example: 'Set 500 AED budget for Food'";
  }

  let category = await storage.getCategoryByName(intent.category);
  
  if (!category) {
    return `❌ Category "${intent.category}" not found. Create it first!`;
  }

  await storage.updateCategory(category.id, { budget: intent.budgetAmount.toString() });
  
  return `✅ Budget Set!\n📁 ${intent.category}\n📊 Budget: AED ${intent.budgetAmount.toFixed(2)}`;
}

async function handleAddFundsToCategory(intent: Intent, storage: IStorage): Promise<string> {
  if (!intent.categoryName || !intent.amount) {
    return "❌ Please specify category and amount.\n\n💡 Example: 'Add 500 AED to Food'";
  }

  const category = await storage.getCategoryByName(intent.categoryName);
  if (!category) {
    return `❌ Category "${intent.categoryName}" not found.`;
  }

  await storage.addFundsToCategory(category.id, intent.amount, intent.description);
  
  const updated = await storage.getCategory(category.id);
  const newBalance = updated?.allocatedFunds ? parseFloat(updated.allocatedFunds.toString()) : 0;

  return `✅ Funds Added!\n\n📁 ${intent.categoryName}\n💵 Added: AED ${intent.amount.toFixed(2)}\n💰 New Balance: AED ${newBalance.toFixed(2)}`;
}

async function handleResetCategory(intent: Intent, storage: IStorage): Promise<string> {
  if (!intent.categoryName) {
    return "❌ Please specify which category to reset.\n\n💡 Example: 'Reset category Food'";
  }

  const category = await storage.getCategoryByName(intent.categoryName);
  if (!category) {
    return `❌ Category "${intent.categoryName}" not found.`;
  }

  const success = await storage.resetCategory(category.id);
  if (success) {
    return `✅ Category Reset!\n\n📁 ${intent.categoryName}\n🔄 All expenses cleared and funds reset to zero.\n💡 The category is still available for new expenses.`;
  }
  
  return `❌ Failed to reset category "${intent.categoryName}".`;
}

// ============= PAYMENT METHOD HANDLERS =============

async function handleViewPaymentMethods(storage: IStorage): Promise<string> {
  const paymentMethods = await storage.getAllPaymentMethods();
  
  if (paymentMethods.length === 0) {
    return "💳 No payment methods yet.\n\n💡 Try: 'Create credit card Chase' or 'Add cash wallet'";
  }

  const totalBalance = paymentMethods.reduce((sum, pm) => sum + parseFloat(pm.balance || "0"), 0);

  let response = `💳 *Payment Methods* (${paymentMethods.length})\n`;
  response += `💰 Total Balance: AED ${totalBalance.toFixed(2)}\n\n`;
  
  for (const pm of paymentMethods) {
    const balance = parseFloat(pm.balance || "0");
    const typeEmoji = pm.type === 'credit_card' ? '💳' : pm.type === 'debit_card' ? '💳' : pm.type === 'cash' ? '💵' : '🏦';
    
    response += `${typeEmoji} *${pm.name}*\n`;
    response += `💰 Balance: AED ${balance.toFixed(2)}`;
    
    if (pm.type === 'credit_card' && pm.creditLimit) {
      const limit = parseFloat(pm.creditLimit.toString());
      const utilization = (balance / limit) * 100;
      response += `\n📊 Credit: AED ${limit.toFixed(2)} (${utilization.toFixed(0)}% used)`;
      
      if (utilization >= 80) {
        response += ` ⚠️`;
      }
      
      if (pm.dueDate) {
        response += `\n📅 Due: Day ${pm.dueDate}`;
      }
    }
    
    response += `\n\n`;
  }

  return response;
}

async function handleCreatePaymentMethod(intent: Intent, storage: IStorage): Promise<string> {
  if (!intent.paymentMethodName || !intent.paymentMethodType) {
    return "❌ Please specify name and type.\n\n💡 Example: 'Create credit card Chase' or 'Add cash wallet'";
  }

  const paymentMethod: InsertPaymentMethod = {
    name: intent.paymentMethodName,
    type: intent.paymentMethodType,
    balance: intent.amount || 0,
    creditLimit: intent.creditLimit,
    dueDate: intent.dueDate,
    isActive: true
  };

  await storage.createPaymentMethod(paymentMethod);

  let response = `✅ Payment Method Created!\n\n💳 ${intent.paymentMethodName}\n📂 Type: ${intent.paymentMethodType}`;
  if (intent.amount) {
    response += `\n💰 Balance: AED ${intent.amount.toFixed(2)}`;
  }
  if (intent.creditLimit) {
    response += `\n📊 Credit Limit: AED ${intent.creditLimit.toFixed(2)}`;
  }
  if (intent.dueDate) {
    response += `\n📅 Due Date: Day ${intent.dueDate}`;
  }

  return response;
}

async function handleUpdatePaymentMethod(intent: Intent, storage: IStorage): Promise<string> {
  if (!intent.paymentMethodName) {
    return "❌ Please specify which payment method to update.\n\n💡 Example: 'Update Chase limit to 5000'";
  }

  const pm = await storage.getPaymentMethodByName(intent.paymentMethodName);
  if (!pm) {
    return `❌ Payment method "${intent.paymentMethodName}" not found.`;
  }

  const updates: Partial<InsertPaymentMethod> = {};
  if (intent.creditLimit !== undefined) {
    updates.creditLimit = intent.creditLimit;
  }
  if (intent.dueDate !== undefined) {
    updates.dueDate = intent.dueDate;
  }

  await storage.updatePaymentMethod(pm.id, updates);

  let response = `✅ Payment Method Updated!\n\n💳 ${intent.paymentMethodName}`;
  if (intent.creditLimit !== undefined) {
    response += `\n📊 New Limit: AED ${intent.creditLimit.toFixed(2)}`;
  }
  if (intent.dueDate !== undefined) {
    response += `\n📅 Due Date: Day ${intent.dueDate}`;
  }

  return response;
}

async function handleDeletePaymentMethod(intent: Intent, storage: IStorage): Promise<string> {
  if (!intent.paymentMethodName) {
    return "❌ Please specify which payment method to delete.\n\n💡 Example: 'Delete Chase card'";
  }

  const pm = await storage.getPaymentMethodByName(intent.paymentMethodName);
  if (!pm) {
    return `❌ Payment method "${intent.paymentMethodName}" not found.`;
  }

  await storage.deletePaymentMethod(pm.id);
  return `✅ Payment method "${intent.paymentMethodName}" deleted successfully!`;
}

async function handleAddFundsToPaymentMethod(intent: Intent, storage: IStorage): Promise<string> {
  if (!intent.paymentMethodName || !intent.amount) {
    return "❌ Please specify payment method and amount.\n\n💡 Example: 'Add 500 AED to Chase'";
  }

  const pm = await storage.getPaymentMethodByName(intent.paymentMethodName);
  if (!pm) {
    return `❌ Payment method "${intent.paymentMethodName}" not found.`;
  }

  await storage.addFundsToPaymentMethod(pm.id, intent.amount, intent.description);
  
  const updated = await storage.getPaymentMethod(pm.id);
  const newBalance = updated?.balance ? parseFloat(updated.balance.toString()) : 0;

  return `✅ Funds Added!\n\n💳 ${intent.paymentMethodName}\n💵 Added: AED ${intent.amount.toFixed(2)}\n💰 New Balance: AED ${newBalance.toFixed(2)}`;
}

async function handlePayCreditCard(intent: Intent, storage: IStorage): Promise<string> {
  if (!intent.amount) {
    return "❌ Please specify the payment amount.\n\n💡 Example: 'Pay credit card 500' or 'Pay Chase 500 from cash'";
  }

  const paymentMethods = await storage.getAllPaymentMethods();
  const creditCards = paymentMethods.filter(pm => pm.type === 'credit_card');
  
  if (creditCards.length === 0) {
    return "❌ No credit cards found. Please add a credit card first.";
  }

  let targetCard = creditCards[0];
  
  if (intent.toPaymentMethod) {
    const foundCard = paymentMethods.find(pm => 
      pm.name.toLowerCase().includes(intent.toPaymentMethod!.toLowerCase()) && 
      pm.type === 'credit_card'
    );
    if (foundCard) {
      targetCard = foundCard;
    }
  }

  let sourcePayment = paymentMethods.find(pm => pm.type === 'cash');
  
  if (intent.fromPaymentMethod) {
    const foundSource = paymentMethods.find(pm => 
      pm.name.toLowerCase().includes(intent.fromPaymentMethod!.toLowerCase())
    );
    if (foundSource) {
      sourcePayment = foundSource;
    }
  }

  if (!sourcePayment) {
    return "❌ No payment source found. Please specify a payment method (e.g., 'pay Chase 500 from cash').";
  }

  const sourceBalance = parseFloat(sourcePayment.balance || "0");
  if (sourceBalance < intent.amount) {
    return `❌ Insufficient funds in ${sourcePayment.name}.\n💰 Available: AED ${sourceBalance.toFixed(2)}\n💳 Required: AED ${intent.amount.toFixed(2)}`;
  }

  const currentCardBalance = parseFloat(targetCard.balance || "0");
  const newCardBalance = Math.max(0, currentCardBalance - intent.amount);
  const newSourceBalance = sourceBalance - intent.amount;

  await storage.updatePaymentMethod(targetCard.id, { 
    balance: newCardBalance 
  });
  
  await storage.updatePaymentMethod(sourcePayment.id, { 
    balance: newSourceBalance 
  });

  let response = `✅ Credit Card Payment Successful!\n\n`;
  response += `💳 ${targetCard.name}\n`;
  response += `💵 Paid: AED ${intent.amount.toFixed(2)}\n`;
  response += `💰 New Balance: AED ${newCardBalance.toFixed(2)}\n\n`;
  response += `📤 From: ${sourcePayment.name}\n`;
  response += `💰 Remaining: AED ${newSourceBalance.toFixed(2)}`;

  if (targetCard.creditLimit) {
    const limit = parseFloat(targetCard.creditLimit.toString());
    const available = limit - newCardBalance;
    response += `\n\n📊 Available Credit: AED ${available.toFixed(2)}`;
  }

  return response;
}

// ============= ANALYTICS & DATA HANDLERS =============

async function handleViewAnalytics(storage: IStorage, intent: Intent): Promise<string> {
  const today = new Date();
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  const thisMonthExpenses = await storage.getAllExpenses(thisMonthStart, today);
  const lastMonthExpenses = await storage.getAllExpenses(lastMonthStart, lastMonthEnd);

  const thisMonthTotal = thisMonthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);
  const lastMonthTotal = lastMonthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);

  const change = thisMonthTotal - lastMonthTotal;
  const percentChange = lastMonthTotal > 0 ? (change / lastMonthTotal) * 100 : 0;

  let response = `📊 *Spending Analytics*\n\n`;
  response += `📅 *This Month:*\n`;
  response += `💰 Total: AED ${thisMonthTotal.toFixed(2)}\n`;
  response += `📝 Transactions: ${thisMonthExpenses.length}\n\n`;
  
  response += `📅 *Last Month:*\n`;
  response += `💰 Total: AED ${lastMonthTotal.toFixed(2)}\n`;
  response += `📝 Transactions: ${lastMonthExpenses.length}\n\n`;
  
  response += `📈 *Trend:*\n`;
  if (change > 0) {
    response += `📈 Spending increased by AED ${Math.abs(change).toFixed(2)} (${Math.abs(percentChange).toFixed(1)}%)`;
  } else if (change < 0) {
    response += `📉 Spending decreased by AED ${Math.abs(change).toFixed(2)} (${Math.abs(percentChange).toFixed(1)}%)`;
  } else {
    response += `➡️ Spending remained the same`;
  }

  const avgDaily = thisMonthExpenses.length > 0 ? thisMonthTotal / today.getDate() : 0;
  response += `\n\n💵 *Average Daily:* AED ${avgDaily.toFixed(2)}`;

  return response;
}

async function handleExportData(storage: IStorage): Promise<string> {
  return `📦 *Data Export*\n\nTo export your data:\n\n1. Visit the web app\n2. Go to "Backup & Restore" page\n3. Click "Export to Excel" or "Backup to JSON"\n\nThis will download all your expenses, categories, and payment methods.\n\n💡 You can also restore data from backup files!`;
}

// ============= HELP & RECEIPT =============

function getHelpMessage(): string {
  return `🤖 *Smart Expense Tracker - Complete Guide*

*💰 EXPENSE MANAGEMENT:*
• "Spent 50 AED on food with Chase card"
• "Paid 100 for groceries yesterday"
• "Delete last expense"
• "Show expenses this month"
• "Summary" / "Monthly report"

*📁 CATEGORY MANAGEMENT:*
• "Show categories"
• "Create category Food"
• "Set 500 AED budget for Food"
• "Add 200 AED to Food category"
• "Reset category Food" - Clear expenses but keep category
• "Delete category Transport"

*💳 PAYMENT METHODS:*
• "Show payment methods" / "My cards"
• "Create credit card Chase with 5000 limit"
• "Add cash wallet with 200"
• "Add 500 AED to Chase"
• "Pay credit card 500" or "Pay Chase 500 from cash"
• "Update Chase limit to 10000"
• "Delete Chase card"

*📊 ANALYTICS & BACKUP:*
• "Show analytics" / "Spending trends"
• "Compare this month to last"
• "Export data" / "Backup data" - Get instructions

*📸 RECEIPT SCANNING:*
• Send receipt photo - Auto-extract expense details!

*💡 INTELLIGENT FEATURES:*
✓ Natural language understanding
✓ Auto-categorization & smart detection
✓ Budget tracking & alerts
✓ Credit card payment automation
✓ Category reset without deletion
✓ Credit limit monitoring
✓ Multi-payment method support
✓ Date range queries & trends
✓ Interactive menus & quick buttons
✓ Receipt OCR with AI vision

📋 Type "menu" anytime for interactive options!
💬 Just chat naturally - I understand context! 🚀`;
}

function getGreetingResponse(): string {
  const greetings = [
    "Hello! 👋 I'm your smart expense tracking assistant.",
    "Hi there! 👋 Ready to track your expenses?",
    "Hey! 👋 I'm here to help you manage your finances.",
    "Good to hear from you! 👋 Welcome to your expense tracker!"
  ];
  
  const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
  return `${randomGreeting}\n\nWhat would you like to do?\n\n💡 Tap the button below to see the menu, or just type naturally!`;
}

export function getMainMenuButtons() {
  return {
    bodyText: "Welcome to your Expense Tracker! 💰\n\nQuick actions:",
    buttons: [
      { id: "view_expenses", title: "📊 View Expenses" },
      { id: "menu", title: "📋 Full Menu" },
      { id: "help", title: "❓ Help" }
    ]
  };
}

export function getMainMenuData() {
  return {
    bodyText: "📋 *Main Menu*\n\nSelect an action from the menu below:",
    buttonText: "📋 Select Action",
    sections: [
      {
        rows: [
          { id: "view_expenses", title: "📊 View Expenses", description: "See all expenses" },
          { id: "add_expense_guide", title: "➕ Add Expense", description: "Log a new expense" },
          { id: "view_summary", title: "📈 Summary", description: "Monthly overview" },
          { id: "view_categories", title: "📂 Categories", description: "View & manage" },
          { id: "view_payment_methods", title: "💳 Payment Methods", description: "View & manage" },
          { id: "view_analytics", title: "📊 Analytics", description: "Spending trends" },
          { id: "export_data", title: "📦 Export Data", description: "Download data" },
          { id: "help", title: "❓ Help & Guide", description: "Full feature list" }
        ]
      }
    ]
  };
}

export function getCategoryMenuData() {
  return {
    bodyText: "📁 *Category Management*\n\nWhat would you like to do?",
    buttonText: "Select Option",
    sections: [
      {
        rows: [
          { id: "create_category_guide", title: "➕ Create Category", description: "Add a new category" },
          { id: "set_budget_guide", title: "💰 Set Budget", description: "Set category budget" },
          { id: "add_funds_category_guide", title: "💵 Add Funds", description: "Allocate funds to category" },
          { id: "view_categories", title: "📂 View Categories", description: "See all categories" },
          { id: "menu", title: "↩️ Main Menu", description: "Back to main menu" }
        ]
      }
    ]
  };
}

export function getPaymentMenuData() {
  return {
    bodyText: "💳 *Payment Method Management*\n\nWhat would you like to do?",
    buttonText: "Select Option",
    sections: [
      {
        rows: [
          { id: "create_payment_guide", title: "➕ Create Method", description: "Add payment method" },
          { id: "add_funds_payment_guide", title: "💵 Add Funds", description: "Deposit to method" },
          { id: "view_payment_methods", title: "💳 View Methods", description: "See all methods" },
          { id: "menu", title: "↩️ Main Menu", description: "Back to main menu" }
        ]
      }
    ]
  };
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

    const ai = await getGeminiAI(storage);
    if (!ai) {
      console.error('[WhatsApp AI] Failed to get Gemini AI instance in handleReceiptImage');
      return "❌ Gemini AI is not configured. Please configure your Gemini API key in settings.";
    }

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
        color: 'bg-blue-500',
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

    let responseText = `📸 *Receipt Scanned Successfully!*\n\n`;
    responseText += `✅ Expense Added:\n`;
    responseText += `💰 Amount: AED ${receiptData.amount.toFixed(2)}\n`;
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

async function executePendingAction(pendingAction: any, storage: IStorage): Promise<string> {
  const { action, intent } = pendingAction;
  
  switch (action) {
    case 'add_expense':
      return await executeAddExpense(intent, storage);
    case 'create_category':
      return await executeCreateCategory(intent, storage);
    case 'create_payment_method':
      return await executeCreatePaymentMethod(intent, storage);
    default:
      return "❌ Could not execute the pending action.";
  }
}

async function executeAddExpense(intent: Intent, storage: IStorage): Promise<string> {
  const categoryName = intent.category || 'Uncategorized';
  let category = await storage.getCategoryByName(categoryName);
  
  if (!category) {
    category = await storage.createCategory({
      name: categoryName,
      color: 'bg-blue-500',
      icon: 'Tag',
      allocatedFunds: 0
    });
  }

  const paymentMethodName = intent.paymentMethod || 'WhatsApp';
  let paymentMethod = await storage.getPaymentMethodByName(paymentMethodName);
  
  if (!paymentMethod && paymentMethodName !== 'WhatsApp') {
    paymentMethod = await storage.createPaymentMethod({
      name: paymentMethodName,
      type: 'cash',
      balance: 0
    });
  }

  const expense: InsertExpense = {
    amount: intent.amount!,
    category: categoryName,
    paymentMethod: paymentMethodName,
    description: intent.description || 'WhatsApp expense',
    date: intent.date ? new Date(intent.date) : new Date()
  };

  await storage.createExpense(expense);

  let response = `✅ *Expense Added Successfully!*\n\n`;
  response += `💰 Amount: AED ${intent.amount!.toFixed(2)}\n`;
  response += `📁 Category: ${categoryName}\n`;
  response += `💳 Payment: ${paymentMethodName}\n`;
  if (intent.description) {
    response += `📝 Note: ${intent.description}\n`;
  }
  
  return response;
}

async function executeCreateCategory(intent: Intent, storage: IStorage): Promise<string> {
  const categoryName = intent.categoryName!;
  
  const newCategory: InsertCategory = {
    name: categoryName,
    color: intent.categoryColor || 'bg-blue-500',
    icon: intent.categoryIcon || 'Tag',
    budget: intent.budgetAmount ? intent.budgetAmount.toString() : undefined,
    allocatedFunds: intent.allocatedFunds || 0
  };

  await storage.createCategory(newCategory);

  let response = `✅ *Category Created Successfully!*\n\n`;
  response += `📁 Name: ${categoryName}\n`;
  if (intent.budgetAmount) {
    response += `📊 Budget: AED ${intent.budgetAmount.toFixed(2)}\n`;
  }
  if (intent.allocatedFunds) {
    response += `💵 Allocated: AED ${intent.allocatedFunds.toFixed(2)}\n`;
  }
  
  return response;
}

async function executeCreatePaymentMethod(intent: Intent, storage: IStorage): Promise<string> {
  const paymentMethodName = intent.paymentMethodName!;
  const paymentMethodType = intent.paymentMethodType || 'cash';
  
  const newPaymentMethod: InsertPaymentMethod = {
    name: paymentMethodName,
    type: paymentMethodType,
    balance: intent.amount || 0,
    creditLimit: intent.creditLimit,
    dueDate: intent.dueDate,
    isActive: true
  };

  await storage.createPaymentMethod(newPaymentMethod);

  let response = `✅ *Payment Method Created Successfully!*\n\n`;
  response += `💳 Name: ${paymentMethodName}\n`;
  response += `📝 Type: ${paymentMethodType.replace('_', ' ').toUpperCase()}\n`;
  if (intent.amount) {
    response += `💰 Balance: AED ${intent.amount.toFixed(2)}\n`;
  }
  if (intent.creditLimit) {
    response += `📊 Credit Limit: AED ${intent.creditLimit.toFixed(2)}\n`;
  }
  
  return response;
}

function getConversationalUnknownResponse(message: string): string {
  const responses = [
    "I'm not quite sure what you mean. Could you rephrase that? 🤔\n\nOr type 'help' to see what I can do!",
    "Hmm, I didn't catch that. Can you try saying it differently? 💭\n\nType 'menu' to see all options!",
    "I'm still learning! Could you explain what you need in a different way? 🤖\n\nOr say 'help' for guidance!",
    "I'm not sure I understand. Maybe try asking in a different way? 🔍\n\nType 'menu' for quick actions!"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

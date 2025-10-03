import { GoogleGenAI } from "@google/genai";
import type { IStorage } from './storage';
import type { InsertExpense, InsertPaymentMethod, InsertCategory } from "@shared/schema";
import { sendTelegramMessage, createInlineKeyboard, createMainMenu } from './telegram-bot';

async function getGeminiAI(storage: IStorage): Promise<GoogleGenAI | null> {
  const config = await storage.getGeminiConfig();
  
  if (config) {
    if (!config.isEnabled) {
      console.log('[Telegram AI] Gemini AI is disabled in settings');
      return null;
    }
    
    if (!config.apiKey) {
      console.error('[Telegram AI] Gemini AI is enabled but no API key configured in settings');
      return null;
    }
    
    return new GoogleGenAI({ apiKey: config.apiKey });
  }
  
  const envApiKey = process.env.GEMINI_API_KEY;
  if (!envApiKey) {
    console.warn('[Telegram AI] No Gemini config found and GEMINI_API_KEY environment variable not set');
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

export async function processTelegramMessage(chatId: string, message: string, storage: IStorage): Promise<void> {
  try {
    const userState = await storage.getTelegramUserState(chatId);
    
    // Check if user is confirming or canceling an action
    if (userState?.state === 'awaiting_confirmation') {
      const intent = await extractIntent(message, storage);
      
      if (intent.action === 'confirm_action' || message.toLowerCase().includes('yes') || message.toLowerCase().includes('confirm')) {
        const pendingAction = JSON.parse(userState.data || '{}');
        await storage.clearTelegramUserState(chatId);
        await executePendingAction(chatId, pendingAction, storage);
        return;
      } else if (intent.action === 'cancel_action' || message.toLowerCase().includes('no') || message.toLowerCase().includes('cancel')) {
        await storage.clearTelegramUserState(chatId);
        await sendTelegramMessage(
          chatId,
          "✅ Action cancelled. What else can I help you with?",
          createMainMenu()
        );
        return;
      }
    }
    
    // Extract intent from message
    const intent = await extractIntent(message, storage);
    
    // Handle the intent
    switch (intent.action) {
      case 'add_expense':
        await handleAddExpense(chatId, intent, storage);
        break;
      case 'view_expenses':
        await handleViewExpenses(chatId, storage, intent);
        break;
      case 'view_summary':
        await handleViewSummary(chatId, storage, intent);
        break;
      case 'delete_expense':
        await handleDeleteExpense(chatId, storage);
        break;
      
      case 'view_categories':
        await handleViewCategories(chatId, storage);
        break;
      case 'create_category':
        await handleCreateCategory(chatId, intent, storage);
        break;
      case 'update_category':
        await handleUpdateCategory(chatId, intent, storage);
        break;
      case 'delete_category':
        await handleDeleteCategory(chatId, intent, storage);
        break;
      case 'set_budget':
        await handleSetBudget(chatId, intent, storage);
        break;
      case 'add_funds_to_category':
        await handleAddFundsToCategory(chatId, intent, storage);
        break;
      case 'reset_category':
        await handleResetCategory(chatId, intent, storage);
        break;
      
      case 'view_payment_methods':
        await handleViewPaymentMethods(chatId, storage);
        break;
      case 'create_payment_method':
        await handleCreatePaymentMethod(chatId, intent, storage);
        break;
      case 'update_payment_method':
        await handleUpdatePaymentMethod(chatId, intent, storage);
        break;
      case 'delete_payment_method':
        await handleDeletePaymentMethod(chatId, intent, storage);
        break;
      case 'add_funds_to_payment_method':
        await handleAddFundsToPaymentMethod(chatId, intent, storage);
        break;
      case 'pay_credit_card':
        await handlePayCreditCard(chatId, intent, storage);
        break;
      
      case 'view_analytics':
        await handleViewAnalytics(chatId, storage, intent);
        break;
      case 'export_data':
      case 'backup_data':
        await sendTelegramMessage(chatId, "📊 For data export, please use the menu option above.", createMainMenu());
        break;
      
      case 'help':
        await sendTelegramMessage(chatId, getHelpMessage(), createMainMenu());
        break;
      case 'greeting':
        await sendTelegramMessage(chatId, getGreetingResponse(), createMainMenu());
        break;
      case 'menu':
        await sendTelegramMessage(chatId, "📋 *Main Menu*\n\nChoose an option below, or just type what you need!", createMainMenu());
        break;
      default:
        await sendTelegramMessage(chatId, getConversationalUnknownResponse(message), createMainMenu());
    }
  } catch (error) {
    console.error('[Telegram AI] Error processing message:', error);
    await sendTelegramMessage(
      chatId,
      "Sorry, I encountered an error processing your request. Please try again.",
      createMainMenu()
    );
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
    console.error('[Telegram AI] Failed to get Gemini AI instance in extractIntent');
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
              "view_analytics", "export_data", "backup_data", "help", "greeting", "menu", 
              "confirm_action", "cancel_action", "unknown"
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

async function handleAddExpense(chatId: string, intent: Intent, storage: IStorage): Promise<void> {
  if (!intent.amount) {
    await sendTelegramMessage(
      chatId,
      "❌ I couldn't find an amount. Please specify how much you spent.\n\n💡 Example: 'I spent 50 AED on groceries'",
      createMainMenu()
    );
    return;
  }

  const categoryName = intent.category || 'Uncategorized';
  const paymentMethodName = intent.paymentMethod || 'Telegram';
  const description = intent.description || 'Telegram expense';

  // Show confirmation
  const confirmMessage = `🤔 *Confirm Expense*\n\n` +
    `💰 Amount: AED ${intent.amount.toFixed(2)}\n` +
    `📁 Category: ${categoryName}\n` +
    `💳 Payment: ${paymentMethodName}\n` +
    `📝 Note: ${description}\n\n` +
    `Would you like to add this expense?`;

  const confirmKeyboard = createInlineKeyboard([
    [
      { text: '✅ Yes, Add It', callback_data: 'confirm_ai_action' },
      { text: '❌ Cancel', callback_data: 'cancel_ai_action' }
    ]
  ]);

  await sendTelegramMessage(chatId, confirmMessage, confirmKeyboard);
  
  // Store pending action
  await storage.setTelegramUserState(chatId, 'awaiting_confirmation', {
    action: 'add_expense',
    amount: intent.amount,
    category: categoryName,
    paymentMethod: paymentMethodName,
    description: description,
    date: intent.date || new Date().toISOString()
  });
}

async function executePendingAction(chatId: string, action: any, storage: IStorage): Promise<void> {
  if (action.action === 'add_expense') {
    let category = await storage.getCategoryByName(action.category);
    
    if (!category) {
      category = await storage.createCategory({
        name: action.category,
        color: 'bg-blue-500',
        icon: 'Tag',
        allocatedFunds: 0
      });
    }

    let paymentMethod = await storage.getPaymentMethodByName(action.paymentMethod);
    
    if (!paymentMethod && action.paymentMethod !== 'Telegram') {
      paymentMethod = await storage.createPaymentMethod({
        name: action.paymentMethod,
        type: 'cash',
        balance: 0
      });
    }

    const expense: InsertExpense = {
      amount: action.amount,
      category: action.category,
      paymentMethod: action.paymentMethod,
      description: action.description,
      date: action.date ? new Date(action.date) : new Date()
    };

    await storage.createExpense(expense);

    let response = `✅ *Expense Added Successfully!*\n\n`;
    response += `💰 Amount: AED ${parseFloat(action.amount).toFixed(2)}\n`;
    response += `📁 Category: ${action.category}\n`;
    response += `💳 Payment: ${action.paymentMethod}\n`;
    if (action.description) {
      response += `📝 Note: ${action.description}\n`;
    }

    await sendTelegramMessage(chatId, response, createMainMenu());
  } else if (action.action === 'create_category') {
    const category: InsertCategory = {
      name: action.categoryName,
      color: action.categoryColor || 'bg-blue-500',
      icon: action.categoryIcon || 'Tag',
      allocatedFunds: action.allocatedFunds || 0,
      budget: action.budgetAmount?.toString()
    };

    await storage.createCategory(category);

    let response = `✅ *Category Created!*\n\n📁 ${action.categoryName}`;
    if (action.budgetAmount) {
      response += `\n📊 Budget: AED ${action.budgetAmount.toFixed(2)}`;
    }
    if (action.allocatedFunds) {
      response += `\n💵 Allocated: AED ${action.allocatedFunds.toFixed(2)}`;
    }

    await sendTelegramMessage(chatId, response, createMainMenu());
  } else if (action.action === 'create_payment_method') {
    const paymentMethod: InsertPaymentMethod = {
      name: action.paymentMethodName,
      type: action.paymentMethodType || 'cash',
      balance: 0,
      creditLimit: action.creditLimit,
      dueDate: action.dueDate,
      isActive: true
    };

    await storage.createPaymentMethod(paymentMethod);

    let response = `✅ *Payment Method Created!*\n\n💳 ${action.paymentMethodName}\n📋 Type: ${action.paymentMethodType}`;
    if (action.creditLimit) {
      response += `\n💰 Credit Limit: AED ${action.creditLimit.toFixed(2)}`;
    }
    if (action.dueDate) {
      response += `\n📅 Due Date: Day ${action.dueDate}`;
    }

    await sendTelegramMessage(chatId, response, createMainMenu());
  }
}

async function handleViewExpenses(chatId: string, storage: IStorage, intent: Intent): Promise<void> {
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
    await sendTelegramMessage(chatId, "📭 No expenses recorded for this period.", createMainMenu());
    return;
  }

  let response = `📊 *Expenses* (${expenses.length} total)\n\n`;
  
  const recentExpenses = expenses.slice(0, 15);
  for (const expense of recentExpenses) {
    const date = new Date(expense.date).toLocaleDateString();
    response += `💰 AED ${parseFloat(expense.amount).toFixed(2)}\n`;
    response += `📁 ${expense.category} | 💳 ${expense.paymentMethod}\n`;
    if (expense.description && expense.description !== 'Telegram expense') {
      response += `📝 ${expense.description}\n`;
    }
    response += `📅 ${date}\n\n`;
  }
  
  if (expenses.length > 15) {
    response += `... and ${expenses.length - 15} more\n\n`;
  }

  const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  response += `💵 *Total: AED ${total.toFixed(2)}*`;

  await sendTelegramMessage(chatId, response, createMainMenu());
}

async function handleViewSummary(chatId: string, storage: IStorage, intent: Intent): Promise<void> {
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
  const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  
  const categoryTotals = new Map<string, number>();
  const paymentMethodTotals = new Map<string, number>();
  
  for (const expense of expenses) {
    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) || 0) + parseFloat(expense.amount)
    );
    paymentMethodTotals.set(
      expense.paymentMethod,
      (paymentMethodTotals.get(expense.paymentMethod) || 0) + parseFloat(expense.amount)
    );
  }

  let response = `📈 *Spending Summary*\n\n`;
  response += `💰 Total Spent: AED ${total.toFixed(2)}\n`;
  response += `📝 Total Expenses: ${expenses.length}\n`;
  response += `📅 Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}\n\n`;
  
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

  await sendTelegramMessage(chatId, response, createMainMenu());
}

async function handleDeleteExpense(chatId: string, storage: IStorage): Promise<void> {
  const expenses = await storage.getAllExpenses();
  
  if (expenses.length === 0) {
    await sendTelegramMessage(chatId, "❌ No expenses to delete.", createMainMenu());
    return;
  }

  const lastExpense = expenses[0];
  const success = await storage.deleteExpense(lastExpense.id);
  
  if (success) {
    const response = `✅ *Deleted expense:*\n💰 AED ${parseFloat(lastExpense.amount).toFixed(2)}\n📁 ${lastExpense.category}\n📝 ${lastExpense.description}`;
    await sendTelegramMessage(chatId, response, createMainMenu());
  } else {
    await sendTelegramMessage(chatId, "❌ Failed to delete expense.", createMainMenu());
  }
}

// ============= CATEGORY HANDLERS =============

async function handleViewCategories(chatId: string, storage: IStorage): Promise<void> {
  const categories = await storage.getAllCategories();
  const expenses = await storage.getAllExpenses();
  
  if (categories.length === 0) {
    await sendTelegramMessage(chatId, "📂 No categories yet. Add an expense to auto-create categories!", createMainMenu());
    return;
  }

  let response = `📂 *Your Categories* (${categories.length})\n\n`;
  
  for (const category of categories) {
    const categoryExpenses = expenses.filter(e => e.category === category.name);
    const total = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const allocated = category.allocatedFunds ? parseFloat(category.allocatedFunds) : 0;
    
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

  await sendTelegramMessage(chatId, response, createMainMenu());
}

async function handleCreateCategory(chatId: string, intent: Intent, storage: IStorage): Promise<void> {
  if (!intent.categoryName) {
    await sendTelegramMessage(
      chatId,
      "❌ Please specify a category name.\n\n💡 Example: 'Create category Food'",
      createMainMenu()
    );
    return;
  }

  const existing = await storage.getCategoryByName(intent.categoryName);
  if (existing) {
    await sendTelegramMessage(chatId, `❌ Category "${intent.categoryName}" already exists!`, createMainMenu());
    return;
  }

  // Show confirmation
  let confirmMessage = `🤔 *Confirm New Category*\n\n📁 Name: ${intent.categoryName}`;
  if (intent.budgetAmount) {
    confirmMessage += `\n📊 Budget: AED ${intent.budgetAmount.toFixed(2)}`;
  }
  if (intent.allocatedFunds) {
    confirmMessage += `\n💵 Allocated Funds: AED ${intent.allocatedFunds.toFixed(2)}`;
  }
  confirmMessage += `\n\nWould you like to create this category?`;

  const confirmKeyboard = createInlineKeyboard([
    [
      { text: '✅ Yes, Create It', callback_data: 'confirm_ai_action' },
      { text: '❌ Cancel', callback_data: 'cancel_ai_action' }
    ]
  ]);

  await sendTelegramMessage(chatId, confirmMessage, confirmKeyboard);
  
  // Store pending action
  await storage.setTelegramUserState(chatId, 'awaiting_confirmation', {
    action: 'create_category',
    categoryName: intent.categoryName,
    categoryColor: intent.categoryColor || 'bg-blue-500',
    categoryIcon: intent.categoryIcon || 'Tag',
    allocatedFunds: intent.allocatedFunds || 0,
    budgetAmount: intent.budgetAmount
  });
}

async function handleUpdateCategory(chatId: string, intent: Intent, storage: IStorage): Promise<void> {
  await sendTelegramMessage(chatId, "This feature is available through the web app. Please use the app to update categories.", createMainMenu());
}

async function handleDeleteCategory(chatId: string, intent: Intent, storage: IStorage): Promise<void> {
  await sendTelegramMessage(chatId, "For safety reasons, category deletion is only available through the web app.", createMainMenu());
}

async function handleSetBudget(chatId: string, intent: Intent, storage: IStorage): Promise<void> {
  await sendTelegramMessage(chatId, "Budget setting is available through the web app or you can create a category with a budget directly!", createMainMenu());
}

async function handleAddFundsToCategory(chatId: string, intent: Intent, storage: IStorage): Promise<void> {
  await sendTelegramMessage(chatId, "Adding funds to categories is available through the web app menu system.", createMainMenu());
}

async function handleResetCategory(chatId: string, intent: Intent, storage: IStorage): Promise<void> {
  await sendTelegramMessage(chatId, "Category reset is available through the web app for safety reasons.", createMainMenu());
}

// ============= PAYMENT METHOD HANDLERS =============

async function handleViewPaymentMethods(chatId: string, storage: IStorage): Promise<void> {
  const allPaymentMethods = await storage.getAllPaymentMethods();
  
  if (allPaymentMethods.length === 0) {
    await sendTelegramMessage(chatId, "💳 No payment methods yet. Add one by saying 'Create credit card Chase'!", createMainMenu());
    return;
  }

  let response = `💳 *Payment Methods* (${allPaymentMethods.length})\n\n`;
  
  for (const method of allPaymentMethods) {
    const balance = method.balance ? parseFloat(method.balance) : 0;
    const typeIcon = method.type === 'credit_card' ? '💳' : 
                   method.type === 'debit_card' ? '🏦' : 
                   method.type === 'bank_account' ? '🏛️' : '💵';
    
    response += `${typeIcon} *${method.name}*\n`;
    response += `  Type: ${method.type.replace('_', ' ')}\n`;
    response += `  Balance: AED ${balance.toFixed(2)}\n`;
    
    if (method.type === 'credit_card' && method.creditLimit) {
      const creditLimit = parseFloat(method.creditLimit);
      const utilization = (balance / creditLimit * 100).toFixed(1);
      response += `  Credit Limit: AED ${creditLimit.toFixed(2)}\n`;
      response += `  Utilization: ${utilization}%\n`;
    }
    
    if (method.dueDate) {
      response += `  Due Date: Day ${method.dueDate} of month\n`;
    }
    
    response += '\n';
  }

  await sendTelegramMessage(chatId, response, createMainMenu());
}

async function handleCreatePaymentMethod(chatId: string, intent: Intent, storage: IStorage): Promise<void> {
  if (!intent.paymentMethodName) {
    await sendTelegramMessage(
      chatId,
      "❌ Please specify a payment method name.\n\n💡 Example: 'Create credit card Chase'",
      createMainMenu()
    );
    return;
  }

  const existing = await storage.getPaymentMethodByName(intent.paymentMethodName);
  if (existing) {
    await sendTelegramMessage(chatId, `❌ Payment method "${intent.paymentMethodName}" already exists!`, createMainMenu());
    return;
  }

  // Show confirmation
  let confirmMessage = `🤔 *Confirm New Payment Method*\n\n💳 Name: ${intent.paymentMethodName}\n📋 Type: ${intent.paymentMethodType || 'cash'}`;
  if (intent.creditLimit) {
    confirmMessage += `\n💰 Credit Limit: AED ${intent.creditLimit.toFixed(2)}`;
  }
  if (intent.dueDate) {
    confirmMessage += `\n📅 Due Date: Day ${intent.dueDate}`;
  }
  confirmMessage += `\n\nWould you like to create this payment method?`;

  const confirmKeyboard = createInlineKeyboard([
    [
      { text: '✅ Yes, Create It', callback_data: 'confirm_ai_action' },
      { text: '❌ Cancel', callback_data: 'cancel_ai_action' }
    ]
  ]);

  await sendTelegramMessage(chatId, confirmMessage, confirmKeyboard);
  
  // Store pending action
  await storage.setTelegramUserState(chatId, 'awaiting_confirmation', {
    action: 'create_payment_method',
    paymentMethodName: intent.paymentMethodName,
    paymentMethodType: intent.paymentMethodType || 'cash',
    creditLimit: intent.creditLimit,
    dueDate: intent.dueDate
  });
}

async function handleUpdatePaymentMethod(chatId: string, intent: Intent, storage: IStorage): Promise<void> {
  await sendTelegramMessage(chatId, "Payment method updates are available through the web app.", createMainMenu());
}

async function handleDeletePaymentMethod(chatId: string, intent: Intent, storage: IStorage): Promise<void> {
  await sendTelegramMessage(chatId, "For safety reasons, payment method deletion is only available through the web app.", createMainMenu());
}

async function handleAddFundsToPaymentMethod(chatId: string, intent: Intent, storage: IStorage): Promise<void> {
  await sendTelegramMessage(chatId, "Adding funds to payment methods is available through the web app menu system.", createMainMenu());
}

async function handlePayCreditCard(chatId: string, intent: Intent, storage: IStorage): Promise<void> {
  await sendTelegramMessage(chatId, "Credit card payments are available through the web app menu system.", createMainMenu());
}

// ============= ANALYTICS HANDLERS =============

async function handleViewAnalytics(chatId: string, storage: IStorage, intent: Intent): Promise<void> {
  const today = new Date();
  let startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let endDate = today;
  
  const expenses = await storage.getAllExpenses(startDate, endDate);
  const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  
  const categoryTotals = new Map<string, number>();
  
  for (const expense of expenses) {
    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) || 0) + parseFloat(expense.amount)
    );
  }

  let response = `📊 *Analytics*\n\n`;
  response += `💰 Total: AED ${total.toFixed(2)}\n`;
  response += `📝 Expenses: ${expenses.length}\n\n`;
  
  if (categoryTotals.size > 0) {
    response += `📁 *Top Categories:*\n`;
    const sorted = Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1]);
    for (const [category, amount] of sorted.slice(0, 5)) {
      const percentage = (amount / total) * 100;
      response += `• ${category}: AED ${amount.toFixed(2)} (${percentage.toFixed(0)}%)\n`;
    }
  }

  await sendTelegramMessage(chatId, response, createMainMenu());
}

// ============= HELPER FUNCTIONS =============

function getHelpMessage(): string {
  return `🤖 *AI Assistant Help*\n\n` +
    `I can help you manage your expenses naturally! Here's what I can do:\n\n` +
    `💰 *Expenses*\n` +
    `• "Spent 50 on food"\n` +
    `• "Paid 100 for lunch with Chase"\n` +
    `• "Show my expenses"\n` +
    `• "Monthly summary"\n\n` +
    `📁 *Categories*\n` +
    `• "Create category Food"\n` +
    `• "Show categories"\n` +
    `• "Add category Transport with 500 budget"\n\n` +
    `💳 *Payment Methods*\n` +
    `• "Create credit card Chase"\n` +
    `• "Show payment methods"\n` +
    `• "Add cash wallet"\n\n` +
    `Just type naturally and I'll understand! I'll always ask for confirmation before making changes. 😊`;
}

function getGreetingResponse(): string {
  return `👋 *Hello!* I'm your AI expense tracking assistant.\n\n` +
    `I can help you track expenses, manage categories, and analyze your spending - all through natural conversation!\n\n` +
    `Try saying:\n` +
    `• "I spent 50 AED on groceries"\n` +
    `• "Show my expenses"\n` +
    `• "Create category Food"\n\n` +
    `Or use the menu below! 😊`;
}

function getConversationalUnknownResponse(message: string): string {
  return `🤔 I'm not quite sure what you want to do.\n\n` +
    `Try:\n` +
    `• "Spent 50 on food" - to add an expense\n` +
    `• "Show expenses" - to view your spending\n` +
    `• "Create category Food" - to add a category\n` +
    `• "Help" - to see all commands\n\n` +
    `Or use the menu buttons below!`;
}

export { getGreetingResponse, getHelpMessage };

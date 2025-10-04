import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
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

async function getOpenAIClient(storage: IStorage): Promise<OpenAI | null> {
  const config = await storage.getOpenAIConfig();
  
  if (config) {
    if (!config.isEnabled) {
      console.log('[Telegram AI] OpenAI is disabled in settings');
      return null;
    }
    
    if (!config.apiKey) {
      console.error('[Telegram AI] OpenAI is enabled but no API key configured in settings');
      return null;
    }
    
    return new OpenAI({ apiKey: config.apiKey });
  }
  
  const envApiKey = process.env.OPENAI_API_KEY;
  if (!envApiKey) {
    console.warn('[Telegram AI] No OpenAI config found and OPENAI_API_KEY environment variable not set');
    return null;
  }
  
  return new OpenAI({ apiKey: envApiKey });
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
    const userState = await storage.getUserState(chatId);
    
    // Check if user is confirming or canceling an action
    if (userState?.state === 'awaiting_confirmation') {
      const intent = await extractIntent(message, storage);
      
      if (intent.action === 'confirm_action' || message.toLowerCase().includes('yes') || message.toLowerCase().includes('confirm')) {
        const pendingAction = JSON.parse(userState.data || '{}');
        await storage.clearUserState(chatId);
        await executePendingAction(chatId, pendingAction, storage);
        return;
      } else if (intent.action === 'cancel_action' || message.toLowerCase().includes('no') || message.toLowerCase().includes('cancel')) {
        await storage.clearUserState(chatId);
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
- add_expense: "spent 50 AED on food", "paid 100 for lunch", "groceries 75 AED", "bought coffee 15", "dinner was 200 yesterday", "I am buying coffee 5 dirham", "buying one coffee cup 5 dirham", "5 AED coffee", "coffee for 5", "I spent 20 dirham on food"
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
   - Amount can be in AED, Dirham, or just a number. "Dirham" = "AED"
   - Examples: "spent 50 on food" → amount=50, category="Food"
   - "paid 100 for groceries with Chase" → amount=100, category="Groceries", paymentMethod="Chase"
   - "I am buying coffee 5 dirham" → amount=5, category="Food & Dining", description="coffee"
   - "buying one coffee cup 5 dirham" → amount=5, category="Food & Dining", description="coffee cup"
   - "5 AED coffee" → amount=5, category="Food & Dining", description="coffee"

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

  const responseSchema = {
    type: "object" as const,
    properties: {
      action: { 
        type: "string" as const,
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
      amount: { type: "number" as const },
      category: { type: "string" as const },
      description: { type: "string" as const },
      date: { type: "string" as const },
      paymentMethod: { type: "string" as const },
      budgetAmount: { type: "number" as const },
      allocatedFunds: { type: "number" as const },
      categoryName: { type: "string" as const },
      categoryColor: { type: "string" as const },
      categoryIcon: { type: "string" as const },
      paymentMethodName: { type: "string" as const },
      paymentMethodType: { type: "string" as const, enum: ["cash", "credit_card", "debit_card", "bank_transfer", "digital_wallet"] },
      creditLimit: { type: "number" as const },
      dueDate: { type: "number" as const },
      fromPaymentMethod: { type: "string" as const },
      toPaymentMethod: { type: "string" as const },
      startDate: { type: "string" as const },
      endDate: { type: "string" as const },
      period: { type: "string" as const }
    },
    required: ["action"]
  };

  // Try OpenAI first
  const openai = await getOpenAIClient(storage);
  if (openai) {
    try {
      console.log('[Telegram AI] Using OpenAI for intent extraction');
      
      // Enhanced system prompt with explicit JSON format instructions
      const enhancedPrompt = systemPrompt + `\n\nIMPORTANT: Always return a valid JSON object with at minimum the "action" field. For add_expense actions, also include "amount", "category", "description" fields when available.`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: enhancedPrompt },
          { role: "user", content: message }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const rawJson = response.choices[0]?.message?.content;
      if (rawJson) {
        const parsed = JSON.parse(rawJson) as Intent;
        console.log('[Telegram AI] OpenAI extracted intent:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('[Telegram AI] OpenAI failed, falling back to Gemini:', error);
    }
  }

  // Fallback to Gemini
  const ai = await getGeminiAI(storage);
  if (!ai) {
    console.error('[Telegram AI] No AI service available for intent extraction');
    return { action: 'unknown' };
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema
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
  await storage.setUserState(chatId, 'awaiting_confirmation', {
    action: 'add_expense',
    amount: intent.amount,
    category: categoryName,
    paymentMethod: paymentMethodName,
    description: description,
    date: intent.date || new Date().toISOString()
  });
}

export async function executePendingAction(chatId: string, action: any, storage: IStorage): Promise<void> {
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

    // Calculate category statistics
    let categoryStats = '';
    if (category) {
      const categoryFundHistory = await storage.getFundHistoryByCategory(category.id);
      const totalAllocated = categoryFundHistory.reduce((sum, f) => sum + parseFloat(f.amount), 0);
      const allExpenses = await storage.getAllExpenses();
      const categoryExpenses = allExpenses.filter(e => e.category.trim() === action.category.trim());
      const totalSpent = categoryExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const available = totalAllocated - totalSpent;
      categoryStats = `📊 Total spend: *AED ${totalSpent.toFixed(2)}*\n✅ Available: *AED ${available.toFixed(2)}*`;
    }

    // Calculate payment method statistics
    let paymentStats = '';
    if (paymentMethod) {
      const currentBalance = parseFloat(paymentMethod.balance || '0');
      const allExpenses = await storage.getAllExpenses();
      const paymentExpenses = allExpenses.filter(e => e.paymentMethod === paymentMethod.name);
      const paymentTotalSpent = paymentExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      paymentStats = `📊 Total spend: *AED ${paymentTotalSpent.toFixed(2)}*\n✅ Available: *AED ${currentBalance.toFixed(2)}*`;
    }

    let response = `From Receipt\n✅ *Expense Added Successfully!*\n\n`;
    response += `🏷️ Category: ${action.category}\n`;
    response += `💵 Amount: *AED ${parseFloat(action.amount).toFixed(2)}*\n`;
    if (action.description) {
      response += `📝 Description: ${action.description}\n`;
    }
    response += `${categoryStats}\n\n`;
    response += `💳 Payment: ${action.paymentMethod}\n`;
    response += `${paymentStats}`;

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
    const expDate = new Date(expense.date);
    const date = `${expDate.getDate().toString().padStart(2, '0')}/${(expDate.getMonth() + 1).toString().padStart(2, '0')}/${expDate.getFullYear()}`;
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
  await storage.setUserState(chatId, 'awaiting_confirmation', {
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
  await storage.setUserState(chatId, 'awaiting_confirmation', {
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

interface ReceiptData {
  amount?: number;
  merchant?: string;
  category?: string;
  date?: string;
  items?: string[];
  confidence: 'high' | 'medium' | 'low';
}

export async function processVoiceMessage(
  chatId: string,
  voiceBuffer: Buffer,
  storage: IStorage
): Promise<void> {
  try {
    await sendTelegramMessage(chatId, '🎙️ Transcribing voice message...');

    let transcribedText = '';

    // Try OpenAI Whisper first
    const openai = await getOpenAIClient(storage);
    if (openai) {
      try {
        console.log('[Telegram AI] Using OpenAI Whisper for voice transcription');
        const file = new File([voiceBuffer], 'voice.ogg', { type: 'audio/ogg' });
        
        const transcription = await openai.audio.transcriptions.create({
          file: file,
          model: "whisper-1",
          language: "en"
        });

        transcribedText = transcription.text;
      } catch (error) {
        console.error('[Telegram AI] OpenAI Whisper failed, falling back to Gemini:', error);
      }
    }

    // Fallback to Gemini AI
    if (!transcribedText || transcribedText.trim() === '') {
      const ai = await getGeminiAI(storage);
      
      if (!ai) {
        await sendTelegramMessage(
          chatId,
          '❌ Voice transcription requires OpenAI or Gemini AI. Please enable one in settings.',
          createMainMenu()
        );
        return;
      }

      try {
        console.log('[Telegram AI] Using Gemini AI for voice transcription');
        
        // Convert buffer to base64 for Gemini
        const base64Audio = voiceBuffer.toString('base64');
        
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: [
            {
              inlineData: {
                mimeType: 'audio/ogg',
                data: base64Audio
              }
            },
            "Transcribe this audio to text. Only return the transcribed text, nothing else."
          ]
        });

        transcribedText = response.text?.trim() || '';
      } catch (error) {
        console.error('[Telegram AI] Gemini transcription failed:', error);
      }
    }
    
    if (!transcribedText || transcribedText.trim() === '') {
      await sendTelegramMessage(
        chatId,
        '❌ Could not transcribe voice message. Please try again or type your message.',
        createMainMenu()
      );
      return;
    }

    console.log('[Telegram AI] Voice transcribed:', transcribedText);

    // Extract intent from transcribed text
    const intent = await extractIntent(transcribedText, storage);

    // Handle add_expense intent
    if (intent.action === 'add_expense') {
      if (!intent.amount) {
        await sendTelegramMessage(
          chatId,
          `🎙️ *Transcribed:* "${transcribedText}"\n\n❌ I couldn't find an amount. Please specify how much you spent.\n\n💡 Example: "I spent 50 AED on groceries"`,
          createMainMenu()
        );
        return;
      }

      const suggestedCategory = intent.category || 'Other';
      const paymentMethodName = intent.paymentMethod || 'Telegram';
      const description = intent.description || transcribedText;
      const expenseDate = intent.date ? new Date(intent.date) : new Date();

      const formattedExpenseDate = `${expenseDate.getDate().toString().padStart(2, '0')}/${(expenseDate.getMonth() + 1).toString().padStart(2, '0')}/${expenseDate.getFullYear()}`;
      
      const confirmMessage = 
        `🎙️ *Voice Message Transcribed!*\n\n` +
        `📝 "${transcribedText}"\n\n` +
        `💰 Amount: AED ${intent.amount.toFixed(2)}\n` +
        `📝 Description: ${description}\n` +
        `📅 Date: ${formattedExpenseDate}\n\n` +
        `Would you like to add this expense?`;

      const confirmKeyboard = createInlineKeyboard([
        [
          { text: '✅ Yes, Add It', callback_data: 'confirm_ai_action' },
          { text: '❌ Cancel', callback_data: 'cancel_ai_action' }
        ]
      ]);

      await sendTelegramMessage(chatId, confirmMessage, confirmKeyboard);

      await storage.setUserState(chatId, 'awaiting_confirmation', {
        action: 'add_expense_from_voice',
        amount: intent.amount,
        suggestedCategory: suggestedCategory,
        paymentMethod: paymentMethodName,
        description: description,
        date: expenseDate.toISOString(),
        transcribedText: transcribedText
      });

    } else {
      // For non-expense intents, process normally
      await sendTelegramMessage(
        chatId,
        `🎙️ *Transcribed:* "${transcribedText}"\n\nProcessing your request...`
      );
      
      // Process the transcribed text through normal AI flow
      await processTelegramMessage(chatId, transcribedText, storage);
    }

  } catch (error) {
    console.error('[Telegram AI] Error processing voice message:', error);
    await sendTelegramMessage(
      chatId,
      '❌ Failed to process voice message. Please try again or type your message.',
      createMainMenu()
    );
  }
}

export async function processReceiptPhoto(
  chatId: string,
  base64Image: string,
  storage: IStorage
): Promise<void> {
  try {
    await sendTelegramMessage(chatId, '🔍 Analyzing receipt...');

    const systemPrompt = `You are a receipt OCR assistant. Extract structured data from receipt images.

Analyze the receipt and return JSON with:
- amount: Total amount (number)
- merchant: Store/merchant name (string)
- category: Best category match from: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Travel, Education, Other
- date: Date in ISO format (YYYY-MM-DD), use today if unclear
- items: Array of item descriptions (up to 5 main items)
- confidence: "high" if all key fields clear, "medium" if some unclear, "low" if very unclear

Return only valid JSON, no markdown.`;

    let receiptData: ReceiptData | null = null;

    // Try OpenAI Vision first
    const openai = await getOpenAIClient(storage);
    if (openai) {
      try {
        console.log('[Telegram AI] Using OpenAI Vision for receipt processing');
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { 
              role: "system", 
              content: systemPrompt 
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract receipt data from this image."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3
        });

        const rawJson = response.choices[0]?.message?.content;
        if (rawJson) {
          receiptData = JSON.parse(rawJson);
        }
      } catch (error) {
        console.error('[Telegram AI] OpenAI Vision failed, falling back to Gemini:', error);
      }
    }

    // Fallback to Gemini Vision
    if (!receiptData) {
      const ai = await getGeminiAI(storage);
      
      if (!ai) {
        await sendTelegramMessage(
          chatId,
          '❌ AI service is not configured. Please enable OpenAI or Gemini AI in settings.',
          createMainMenu()
        );
        return;
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json"
        },
        contents: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          'Extract receipt data from this image.'
        ]
      });

      const rawJson = response.text;
      if (!rawJson) {
        await sendTelegramMessage(
          chatId,
          '❌ Failed to analyze receipt. Please try again.',
          createMainMenu()
        );
        return;
      }
      
      receiptData = JSON.parse(rawJson);
    }

    if (!receiptData) {
      await sendTelegramMessage(
        chatId,
        '❌ Failed to analyze receipt. Please try again.',
        createMainMenu()
      );
      return;
    }

    if (receiptData.confidence === 'low' || !receiptData.amount) {
      await sendTelegramMessage(
        chatId,
        '😕 I had trouble reading this receipt clearly. Please try:\n\n' +
        '• Taking a clearer photo\n' +
        '• Better lighting\n' +
        '• Flattening the receipt\n\n' +
        'Or you can add the expense manually using natural language like "Spent 50 on food"',
        createMainMenu()
      );
      return;
    }

    const suggestedCategory = receiptData.category || 'Other';
    const paymentMethodName = 'Telegram';
    const description = receiptData.merchant 
      ? `${receiptData.merchant}${receiptData.items && receiptData.items.length > 0 ? ` - ${receiptData.items.slice(0, 2).join(', ')}` : ''}`
      : 'Receipt scan';
    const expenseDate = receiptData.date ? new Date(receiptData.date) : new Date();

    const formattedExpenseDate = `${expenseDate.getDate().toString().padStart(2, '0')}/${(expenseDate.getMonth() + 1).toString().padStart(2, '0')}/${expenseDate.getFullYear()}`;
    const confirmMessage = 
      `📸 *Receipt Scanned!*\n\n` +
      `💰 Amount: AED ${receiptData.amount.toFixed(2)}\n` +
      (receiptData.merchant ? `🏪 Merchant: ${receiptData.merchant}\n` : '') +
      `📝 Description: ${description}\n` +
      `📅 Date: ${formattedExpenseDate}\n\n` +
      (receiptData.items && receiptData.items.length > 0 
        ? `📋 Items:\n${receiptData.items.slice(0, 3).map(item => `• ${item}`).join('\n')}\n\n`
        : '') +
      `${receiptData.confidence === 'medium' ? '⚠️ Medium confidence - please verify\n\n' : ''}` +
      `Would you like to add this expense?`;

    const confirmKeyboard = createInlineKeyboard([
      [
        { text: '✅ Yes, Add It', callback_data: 'confirm_ai_action' },
        { text: '❌ Cancel', callback_data: 'cancel_ai_action' }
      ]
    ]);

    await sendTelegramMessage(chatId, confirmMessage, confirmKeyboard);

    await storage.setUserState(chatId, 'awaiting_confirmation', {
      action: 'add_expense_from_receipt',
      amount: receiptData.amount,
      suggestedCategory: suggestedCategory,
      paymentMethod: paymentMethodName,
      description: description,
      date: expenseDate.toISOString()
    });

  } catch (error) {
    console.error('[Telegram AI] Error processing receipt photo:', error);
    await sendTelegramMessage(
      chatId,
      '❌ Failed to process receipt. Please try again or add the expense manually.',
      createMainMenu()
    );
  }
}

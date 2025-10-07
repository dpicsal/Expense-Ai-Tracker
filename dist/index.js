var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/telegram-bot.ts
var telegram_bot_exports = {};
__export(telegram_bot_exports, {
  answerCallbackQuery: () => answerCallbackQuery,
  createInlineKeyboard: () => createInlineKeyboard,
  createMainMenu: () => createMainMenu,
  getWebhookInfo: () => getWebhookInfo,
  initializeTelegramBot: () => initializeTelegramBot,
  isBotRunning: () => isBotRunning,
  restartTelegramBot: () => restartTelegramBot,
  sendTelegramDocument: () => sendTelegramDocument,
  sendTelegramMessage: () => sendTelegramMessage,
  setWebhook: () => setWebhook,
  stopTelegramBot: () => stopTelegramBot
});
function getWebhookUrl() {
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    const baseUrl = appUrl.replace(/\/$/, "");
    return `${baseUrl}/api/integrations/telegram/webhook`;
  }
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) {
    const domains = replitDomains.split(",");
    const primaryDomain = domains[0];
    return `https://${primaryDomain}/api/integrations/telegram/webhook`;
  }
  console.error("[Telegram Bot] APP_URL or REPLIT_DOMAINS environment variable not found");
  return null;
}
async function setWebhook(webhookSecret) {
  if (!botToken) {
    console.log("[Telegram Bot] Cannot set webhook - bot not configured");
    return false;
  }
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    console.error("[Telegram Bot] Cannot set webhook - invalid webhook URL");
    return false;
  }
  try {
    const payload = {
      url: webhookUrl
    };
    if (webhookSecret) {
      payload.secret_token = webhookSecret;
    }
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Telegram Bot] Failed to set webhook:", errorData);
      return false;
    }
    const data = await response.json();
    console.log("[Telegram Bot] Webhook set successfully:", webhookUrl);
    return data.ok;
  } catch (error) {
    console.error("[Telegram Bot] Error setting webhook:", error);
    return false;
  }
}
async function getWebhookInfo() {
  if (!botToken) {
    console.log("[Telegram Bot] Cannot get webhook info - bot not configured");
    return null;
  }
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Telegram Bot] Failed to get webhook info:", errorData);
      return null;
    }
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("[Telegram Bot] Error getting webhook info:", error);
    return null;
  }
}
async function initializeTelegramBot(storage2) {
  try {
    const config = await storage2.getTelegramBotConfig();
    if (!config || !config.isEnabled || !config.botToken) {
      console.log("[Telegram Bot] Bot is not enabled or token is missing");
      botToken = null;
      return;
    }
    botToken = config.botToken;
    console.log("[Telegram Bot] Bot configured successfully");
    await setWebhook(config.webhookSecret || void 0);
    const webhookInfo = await getWebhookInfo();
    if (webhookInfo) {
      console.log("[Telegram Bot] Webhook info:", JSON.stringify(webhookInfo, null, 2));
    }
  } catch (error) {
    console.error("[Telegram Bot] Failed to initialize bot:", error);
    botToken = null;
  }
}
async function sendTelegramMessage(chatId, text2, replyMarkup) {
  if (!botToken) {
    console.log("[Telegram Bot] Cannot send message - bot not configured");
    return false;
  }
  try {
    const message = {
      chat_id: chatId,
      text: text2,
      parse_mode: "Markdown"
    };
    if (replyMarkup) {
      message.reply_markup = replyMarkup;
    }
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(message)
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Telegram Bot] Failed to send message:", errorData);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Telegram Bot] Error sending message:", error);
    return false;
  }
}
async function answerCallbackQuery(callbackQueryId, text2) {
  if (!botToken) {
    console.log("[Telegram Bot] Cannot answer callback query - bot not configured");
    return false;
  }
  try {
    const payload = {
      callback_query_id: callbackQueryId
    };
    if (text2) {
      payload.text = text2;
    }
    const response = await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Telegram Bot] Failed to answer callback query:", errorData);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Telegram Bot] Error answering callback query:", error);
    return false;
  }
}
function createInlineKeyboard(buttons) {
  return {
    inline_keyboard: buttons
  };
}
function createMainMenu() {
  return createInlineKeyboard([
    [
      { text: "\u{1F4CA} Dashboard", callback_data: "menu_dashboard" },
      { text: "\u2795 Add Expense", callback_data: "menu_add" }
    ],
    [
      { text: "\u{1F4C8} Analytics", callback_data: "menu_analytics" },
      { text: "\u{1F3F7}\uFE0F Categories", callback_data: "menu_categories" }
    ],
    [
      { text: "\u{1F4B3} Payment Methods", callback_data: "menu_payments" },
      { text: "\u{1F4BE} Backup", callback_data: "menu_backup" }
    ]
  ]);
}
async function sendTelegramDocument(chatId, fileName, fileContent, caption, replyMarkup) {
  if (!botToken) {
    console.log("[Telegram Bot] Cannot send document - bot not configured");
    return false;
  }
  try {
    const formData = new FormData();
    let blob;
    if (fileContent instanceof Buffer) {
      blob = new Blob([fileContent], {
        type: fileName.endsWith(".xlsx") ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/octet-stream"
      });
    } else {
      blob = new Blob([fileContent], { type: "application/json" });
    }
    formData.append("chat_id", chatId.toString());
    formData.append("document", blob, fileName);
    if (caption) {
      formData.append("caption", caption);
    }
    if (replyMarkup) {
      formData.append("reply_markup", JSON.stringify(replyMarkup));
    }
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Telegram Bot] Failed to send document:", errorData);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Telegram Bot] Error sending document:", error);
    return false;
  }
}
async function stopTelegramBot() {
  botToken = null;
  console.log("[Telegram Bot] Bot stopped");
}
async function restartTelegramBot(storage2) {
  await stopTelegramBot();
  await initializeTelegramBot(storage2);
}
function isBotRunning() {
  return botToken !== null;
}
var botToken;
var init_telegram_bot = __esm({
  "server/telegram-bot.ts"() {
    "use strict";
    botToken = null;
  }
});

// server/telegram-ai.ts
var telegram_ai_exports = {};
__export(telegram_ai_exports, {
  executePendingAction: () => executePendingAction,
  getGreetingResponse: () => getGreetingResponse,
  getHelpMessage: () => getHelpMessage,
  processReceiptPhoto: () => processReceiptPhoto,
  processTelegramMessage: () => processTelegramMessage,
  processVoiceMessage: () => processVoiceMessage
});
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
async function getGeminiAI(storage2) {
  const config = await storage2.getGeminiConfig();
  if (config) {
    if (!config.isEnabled) {
      console.log("[Telegram AI] Gemini AI is disabled in settings");
      return null;
    }
    if (!config.apiKey) {
      console.error("[Telegram AI] Gemini AI is enabled but no API key configured in settings");
      return null;
    }
    return new GoogleGenAI({ apiKey: config.apiKey });
  }
  const envApiKey = process.env.GEMINI_API_KEY;
  if (!envApiKey) {
    console.warn("[Telegram AI] No Gemini config found and GEMINI_API_KEY environment variable not set");
    return null;
  }
  return new GoogleGenAI({ apiKey: envApiKey });
}
async function getOpenAIClient(storage2) {
  const config = await storage2.getOpenAIConfig();
  if (config) {
    if (!config.isEnabled) {
      console.log("[Telegram AI] OpenAI is disabled in settings");
      return null;
    }
    if (!config.apiKey) {
      console.error("[Telegram AI] OpenAI is enabled but no API key configured in settings");
      return null;
    }
    return new OpenAI({ apiKey: config.apiKey });
  }
  const envApiKey = process.env.OPENAI_API_KEY;
  if (!envApiKey) {
    console.warn("[Telegram AI] No OpenAI config found and OPENAI_API_KEY environment variable not set");
    return null;
  }
  return new OpenAI({ apiKey: envApiKey });
}
async function processTelegramMessage(chatId, message, storage2) {
  try {
    const userState = await storage2.getUserState(chatId);
    if (userState?.state === "awaiting_confirmation") {
      const intent2 = await extractIntent(message, storage2);
      if (intent2.action === "confirm_action" || message.toLowerCase().includes("yes") || message.toLowerCase().includes("confirm")) {
        const pendingAction = JSON.parse(userState.data || "{}");
        await storage2.clearUserState(chatId);
        await executePendingAction(chatId, pendingAction, storage2);
        return;
      } else if (intent2.action === "cancel_action" || message.toLowerCase().includes("no") || message.toLowerCase().includes("cancel")) {
        await storage2.clearUserState(chatId);
        await sendTelegramMessage(
          chatId,
          "\u2705 Action cancelled. What else can I help you with?",
          createMainMenu()
        );
        return;
      }
    }
    const intent = await extractIntent(message, storage2);
    switch (intent.action) {
      case "add_expense":
        await handleAddExpense(chatId, intent, storage2);
        break;
      case "view_expenses":
        await handleViewExpenses(chatId, storage2, intent);
        break;
      case "view_summary":
        await handleViewSummary(chatId, storage2, intent);
        break;
      case "delete_expense":
        await handleDeleteExpense(chatId, storage2);
        break;
      case "view_categories":
        await handleViewCategories(chatId, storage2);
        break;
      case "create_category":
        await handleCreateCategory(chatId, intent, storage2);
        break;
      case "update_category":
        await handleUpdateCategory(chatId, intent, storage2);
        break;
      case "delete_category":
        await handleDeleteCategory(chatId, intent, storage2);
        break;
      case "set_budget":
        await handleSetBudget(chatId, intent, storage2);
        break;
      case "add_funds_to_category":
        await handleAddFundsToCategory(chatId, intent, storage2);
        break;
      case "reset_category":
        await handleResetCategory(chatId, intent, storage2);
        break;
      case "view_payment_methods":
        await handleViewPaymentMethods(chatId, storage2);
        break;
      case "create_payment_method":
        await handleCreatePaymentMethod(chatId, intent, storage2);
        break;
      case "update_payment_method":
        await handleUpdatePaymentMethod(chatId, intent, storage2);
        break;
      case "delete_payment_method":
        await handleDeletePaymentMethod(chatId, intent, storage2);
        break;
      case "add_funds_to_payment_method":
        await handleAddFundsToPaymentMethod(chatId, intent, storage2);
        break;
      case "pay_credit_card":
        await handlePayCreditCard(chatId, intent, storage2);
        break;
      case "view_analytics":
        await handleViewAnalytics(chatId, storage2, intent);
        break;
      case "export_data":
      case "backup_data":
        await sendTelegramMessage(chatId, "\u{1F4CA} For data export, please use the menu option above.", createMainMenu());
        break;
      case "help":
        await sendTelegramMessage(chatId, getHelpMessage(), createMainMenu());
        break;
      case "greeting":
        await sendTelegramMessage(chatId, getGreetingResponse(), createMainMenu());
        break;
      case "menu":
        await sendTelegramMessage(chatId, "\u{1F4CB} *Main Menu*\n\nChoose an option below, or just type what you need!", createMainMenu());
        break;
      default:
        await sendTelegramMessage(chatId, getConversationalUnknownResponse(message), createMainMenu());
    }
  } catch (error) {
    console.error("[Telegram AI] Error processing message:", error);
    await sendTelegramMessage(
      chatId,
      "Sorry, I encountered an error processing your request. Please try again.",
      createMainMenu()
    );
  }
}
async function extractIntent(message, storage2) {
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
   - Examples: "spent 50 on food" \u2192 amount=50, category="Food"
   - "paid 100 for groceries with Chase" \u2192 amount=100, category="Groceries", paymentMethod="Chase"
   - "I am buying coffee 5 dirham" \u2192 amount=5, category="Food & Dining", description="coffee"
   - "buying one coffee cup 5 dirham" \u2192 amount=5, category="Food & Dining", description="coffee cup"
   - "5 AED coffee" \u2192 amount=5, category="Food & Dining", description="coffee"

2. For categories: extract categoryName, budgetAmount, allocatedFunds, categoryColor, categoryIcon
   - Examples: "create Food with 500 budget" \u2192 categoryName="Food", budgetAmount=500

3. For payment methods: extract paymentMethodName, paymentMethodType, creditLimit, dueDate, amount
   - Examples: "add Chase credit card 5000 limit" \u2192 paymentMethodName="Chase", paymentMethodType="credit_card", creditLimit=5000

4. For credit card payments: extract amount, toPaymentMethod (credit card), fromPaymentMethod (source)
   - Examples: "pay Chase 500 from cash" \u2192 amount=500, toPaymentMethod="Chase", fromPaymentMethod="cash"

5. For date ranges: extract startDate, endDate, period
   - Examples: "expenses last week" \u2192 period="last_week"

**CONTEXT AWARENESS:**
- "add 500 to Food" \u2192 if Food is a category, use add_funds_to_category; if payment method, use add_funds_to_payment_method
- "pay 500" \u2192 check if there's a credit card context, use pay_credit_card
- "reset Food" \u2192 use reset_category to clear expenses but keep category
- "clear expenses" \u2192 if category specified, use reset_category; otherwise ask for clarification

Return JSON only with the extracted intent and parameters.`;
  const responseSchema = {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: [
          "add_expense",
          "view_expenses",
          "view_summary",
          "delete_expense",
          "view_categories",
          "create_category",
          "update_category",
          "delete_category",
          "set_budget",
          "add_funds_to_category",
          "reset_category",
          "view_payment_methods",
          "create_payment_method",
          "update_payment_method",
          "delete_payment_method",
          "add_funds_to_payment_method",
          "pay_credit_card",
          "view_analytics",
          "export_data",
          "backup_data",
          "help",
          "greeting",
          "menu",
          "confirm_action",
          "cancel_action",
          "unknown"
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
  };
  const openai = await getOpenAIClient(storage2);
  if (openai) {
    try {
      console.log("[Telegram AI] Using OpenAI for intent extraction");
      const enhancedPrompt = systemPrompt + `

IMPORTANT: Always return a valid JSON object with at minimum the "action" field. For add_expense actions, also include "amount", "category", "description" fields when available.`;
      const response2 = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: enhancedPrompt },
          { role: "user", content: message }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });
      const rawJson2 = response2.choices[0]?.message?.content;
      if (rawJson2) {
        const parsed = JSON.parse(rawJson2);
        console.log("[Telegram AI] OpenAI extracted intent:", parsed);
        return parsed;
      }
    } catch (error) {
      console.error("[Telegram AI] OpenAI failed, falling back to Gemini:", error);
    }
  }
  const ai = await getGeminiAI(storage2);
  if (!ai) {
    console.error("[Telegram AI] No AI service available for intent extraction");
    return { action: "unknown" };
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
    return JSON.parse(rawJson);
  }
  return { action: "unknown" };
}
async function handleAddExpense(chatId, intent, storage2) {
  if (!intent.amount) {
    await sendTelegramMessage(
      chatId,
      "\u274C I couldn't find an amount. Please specify how much you spent.\n\n\u{1F4A1} Example: 'I spent 50 AED on groceries'",
      createMainMenu()
    );
    return;
  }
  const categoryName = intent.category || "Uncategorized";
  const paymentMethodName = intent.paymentMethod || "Telegram";
  const description = intent.description || "Telegram expense";
  const confirmMessage = `\u{1F914} *Confirm Expense*

\u{1F4B0} Amount: AED ${intent.amount.toFixed(2)}
\u{1F4C1} Category: ${categoryName}
\u{1F4B3} Payment: ${paymentMethodName}
\u{1F4DD} Note: ${description}

Would you like to add this expense?`;
  const confirmKeyboard = createInlineKeyboard([
    [
      { text: "\u2705 Yes, Add It", callback_data: "confirm_ai_action" },
      { text: "\u274C Cancel", callback_data: "cancel_ai_action" }
    ]
  ]);
  await sendTelegramMessage(chatId, confirmMessage, confirmKeyboard);
  await storage2.setUserState(chatId, "awaiting_confirmation", {
    action: "add_expense",
    amount: intent.amount,
    category: categoryName,
    paymentMethod: paymentMethodName,
    description,
    date: intent.date || (/* @__PURE__ */ new Date()).toISOString()
  });
}
async function executePendingAction(chatId, action, storage2) {
  if (action.action === "add_expense") {
    let category = await storage2.getCategoryByName(action.category);
    if (!category) {
      category = await storage2.createCategory({
        name: action.category,
        color: "bg-blue-500",
        icon: "Tag",
        allocatedFunds: 0
      });
    }
    let paymentMethod = await storage2.getPaymentMethodByName(action.paymentMethod);
    if (!paymentMethod && action.paymentMethod !== "Telegram") {
      paymentMethod = await storage2.createPaymentMethod({
        name: action.paymentMethod,
        type: "cash",
        balance: 0
      });
    }
    const expense = {
      amount: action.amount,
      category: action.category,
      paymentMethod: action.paymentMethod,
      description: action.description,
      date: action.date ? new Date(action.date) : /* @__PURE__ */ new Date()
    };
    await storage2.createExpense(expense);
    let categoryStats = "";
    if (category) {
      const categoryFundHistory = await storage2.getFundHistoryByCategory(category.id);
      const totalAllocated = categoryFundHistory.reduce((sum, f) => sum + parseFloat(f.amount), 0);
      const allExpenses = await storage2.getAllExpenses();
      const categoryExpenses = allExpenses.filter((e) => e.category.trim() === action.category.trim());
      const totalSpent = categoryExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const available = totalAllocated - totalSpent;
      categoryStats = `\u{1F4CA} Total spend: *AED ${totalSpent.toFixed(2)}*
\u2705 Available: *AED ${available.toFixed(2)}*`;
    }
    let paymentStats = "";
    if (paymentMethod) {
      const currentBalance = parseFloat(paymentMethod.balance || "0");
      const allExpenses = await storage2.getAllExpenses();
      const paymentExpenses = allExpenses.filter((e) => e.paymentMethod === paymentMethod.name);
      const paymentTotalSpent = paymentExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      paymentStats = `\u{1F4CA} Total spend: *AED ${paymentTotalSpent.toFixed(2)}*
\u2705 Available: *AED ${currentBalance.toFixed(2)}*`;
    }
    let response = `From Receipt
\u2705 *Expense Added Successfully!*

`;
    response += `\u{1F3F7}\uFE0F Category: ${action.category}
`;
    response += `\u{1F4B5} Amount: *AED ${parseFloat(action.amount).toFixed(2)}*
`;
    if (action.description) {
      response += `\u{1F4DD} Description: ${action.description}
`;
    }
    response += `${categoryStats}

`;
    response += `\u{1F4B3} Payment: ${action.paymentMethod}
`;
    response += `${paymentStats}`;
    await sendTelegramMessage(chatId, response, createMainMenu());
  } else if (action.action === "create_category") {
    const category = {
      name: action.categoryName,
      color: action.categoryColor || "bg-blue-500",
      icon: action.categoryIcon || "Tag",
      allocatedFunds: action.allocatedFunds || 0,
      budget: action.budgetAmount?.toString()
    };
    await storage2.createCategory(category);
    let response = `\u2705 *Category Created!*

\u{1F4C1} ${action.categoryName}`;
    if (action.budgetAmount) {
      response += `
\u{1F4CA} Budget: AED ${action.budgetAmount.toFixed(2)}`;
    }
    if (action.allocatedFunds) {
      response += `
\u{1F4B5} Allocated: AED ${action.allocatedFunds.toFixed(2)}`;
    }
    await sendTelegramMessage(chatId, response, createMainMenu());
  } else if (action.action === "create_payment_method") {
    const paymentMethod = {
      name: action.paymentMethodName,
      type: action.paymentMethodType || "cash",
      balance: 0,
      creditLimit: action.creditLimit,
      dueDate: action.dueDate,
      isActive: true
    };
    await storage2.createPaymentMethod(paymentMethod);
    let response = `\u2705 *Payment Method Created!*

\u{1F4B3} ${action.paymentMethodName}
\u{1F4CB} Type: ${action.paymentMethodType}`;
    if (action.creditLimit) {
      response += `
\u{1F4B0} Credit Limit: AED ${action.creditLimit.toFixed(2)}`;
    }
    if (action.dueDate) {
      response += `
\u{1F4C5} Due Date: Day ${action.dueDate}`;
    }
    await sendTelegramMessage(chatId, response, createMainMenu());
  }
}
async function handleViewExpenses(chatId, storage2, intent) {
  const today = /* @__PURE__ */ new Date();
  let startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let endDate = today;
  if (intent.startDate) {
    startDate = new Date(intent.startDate);
  }
  if (intent.endDate) {
    endDate = new Date(intent.endDate);
  }
  const expenses2 = await storage2.getAllExpenses(startDate, endDate);
  if (expenses2.length === 0) {
    await sendTelegramMessage(chatId, "\u{1F4ED} No expenses recorded for this period.", createMainMenu());
    return;
  }
  let response = `\u{1F4CA} *Expenses* (${expenses2.length} total)

`;
  const recentExpenses = expenses2.slice(0, 15);
  for (const expense of recentExpenses) {
    const expDate = new Date(expense.date);
    const date = `${expDate.getDate().toString().padStart(2, "0")}/${(expDate.getMonth() + 1).toString().padStart(2, "0")}/${expDate.getFullYear()}`;
    response += `\u{1F4B0} AED ${parseFloat(expense.amount).toFixed(2)}
`;
    response += `\u{1F4C1} ${expense.category} | \u{1F4B3} ${expense.paymentMethod}
`;
    if (expense.description && expense.description !== "Telegram expense") {
      response += `\u{1F4DD} ${expense.description}
`;
    }
    response += `\u{1F4C5} ${date}

`;
  }
  if (expenses2.length > 15) {
    response += `... and ${expenses2.length - 15} more

`;
  }
  const total = expenses2.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  response += `\u{1F4B5} *Total: AED ${total.toFixed(2)}*`;
  await sendTelegramMessage(chatId, response, createMainMenu());
}
async function handleViewSummary(chatId, storage2, intent) {
  const today = /* @__PURE__ */ new Date();
  let startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let endDate = today;
  if (intent.startDate) {
    startDate = new Date(intent.startDate);
  }
  if (intent.endDate) {
    endDate = new Date(intent.endDate);
  }
  const expenses2 = await storage2.getAllExpenses(startDate, endDate);
  const total = expenses2.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const categoryTotals = /* @__PURE__ */ new Map();
  const paymentMethodTotals = /* @__PURE__ */ new Map();
  for (const expense of expenses2) {
    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) || 0) + parseFloat(expense.amount)
    );
    paymentMethodTotals.set(
      expense.paymentMethod,
      (paymentMethodTotals.get(expense.paymentMethod) || 0) + parseFloat(expense.amount)
    );
  }
  let response = `\u{1F4C8} *Spending Summary*

`;
  response += `\u{1F4B0} Total Spent: AED ${total.toFixed(2)}
`;
  response += `\u{1F4DD} Total Expenses: ${expenses2.length}
`;
  const formattedStartDate = `${startDate.getDate().toString().padStart(2, "0")}/${(startDate.getMonth() + 1).toString().padStart(2, "0")}/${startDate.getFullYear()}`;
  const formattedEndDate = `${endDate.getDate().toString().padStart(2, "0")}/${(endDate.getMonth() + 1).toString().padStart(2, "0")}/${endDate.getFullYear()}`;
  response += `\u{1F4C5} Period: ${formattedStartDate} - ${formattedEndDate}

`;
  if (categoryTotals.size > 0) {
    response += `\u{1F4C1} *By Category:*
`;
    const sorted = Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1]);
    for (const [category, amount] of sorted.slice(0, 8)) {
      const percentage = amount / total * 100;
      response += `\u2022 ${category}: AED ${amount.toFixed(2)} (${percentage.toFixed(0)}%)
`;
    }
    response += `
`;
  }
  if (paymentMethodTotals.size > 0) {
    response += `\u{1F4B3} *By Payment Method:*
`;
    const sorted = Array.from(paymentMethodTotals.entries()).sort((a, b) => b[1] - a[1]);
    for (const [method, amount] of sorted) {
      const percentage = amount / total * 100;
      response += `\u2022 ${method}: AED ${amount.toFixed(2)} (${percentage.toFixed(0)}%)
`;
    }
  }
  await sendTelegramMessage(chatId, response, createMainMenu());
}
async function handleDeleteExpense(chatId, storage2) {
  const expenses2 = await storage2.getAllExpenses();
  if (expenses2.length === 0) {
    await sendTelegramMessage(chatId, "\u274C No expenses to delete.", createMainMenu());
    return;
  }
  const lastExpense = expenses2[0];
  const success = await storage2.deleteExpense(lastExpense.id);
  if (success) {
    const response = `\u2705 *Deleted expense:*
\u{1F4B0} AED ${parseFloat(lastExpense.amount).toFixed(2)}
\u{1F4C1} ${lastExpense.category}
\u{1F4DD} ${lastExpense.description}`;
    await sendTelegramMessage(chatId, response, createMainMenu());
  } else {
    await sendTelegramMessage(chatId, "\u274C Failed to delete expense.", createMainMenu());
  }
}
async function handleViewCategories(chatId, storage2) {
  const categories2 = await storage2.getAllCategories();
  const expenses2 = await storage2.getAllExpenses();
  if (categories2.length === 0) {
    await sendTelegramMessage(chatId, "\u{1F4C2} No categories yet. Add an expense to auto-create categories!", createMainMenu());
    return;
  }
  let response = `\u{1F4C2} *Your Categories* (${categories2.length})

`;
  for (const category of categories2) {
    const categoryExpenses = expenses2.filter((e) => e.category === category.name);
    const total = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const allocated = category.allocatedFunds ? parseFloat(category.allocatedFunds) : 0;
    response += `\u{1F4C1} *${category.name}*
`;
    response += `\u{1F4B0} Spent: AED ${total.toFixed(2)}`;
    if (allocated > 0) {
      const available = allocated - total;
      response += ` | \u{1F4B5} Available: AED ${available.toFixed(2)}`;
    }
    if (category.budget && parseFloat(category.budget) > 0) {
      const budget = parseFloat(category.budget);
      const percentage = total / budget * 100;
      response += `
\u{1F4CA} Budget: AED ${budget.toFixed(2)} (${percentage.toFixed(0)}% used)`;
      if (percentage >= 100) {
        response += ` \u26A0\uFE0F`;
      }
    }
    response += `

`;
  }
  await sendTelegramMessage(chatId, response, createMainMenu());
}
async function handleCreateCategory(chatId, intent, storage2) {
  if (!intent.categoryName) {
    await sendTelegramMessage(
      chatId,
      "\u274C Please specify a category name.\n\n\u{1F4A1} Example: 'Create category Food'",
      createMainMenu()
    );
    return;
  }
  const existing = await storage2.getCategoryByName(intent.categoryName);
  if (existing) {
    await sendTelegramMessage(chatId, `\u274C Category "${intent.categoryName}" already exists!`, createMainMenu());
    return;
  }
  let confirmMessage = `\u{1F914} *Confirm New Category*

\u{1F4C1} Name: ${intent.categoryName}`;
  if (intent.budgetAmount) {
    confirmMessage += `
\u{1F4CA} Budget: AED ${intent.budgetAmount.toFixed(2)}`;
  }
  if (intent.allocatedFunds) {
    confirmMessage += `
\u{1F4B5} Allocated Funds: AED ${intent.allocatedFunds.toFixed(2)}`;
  }
  confirmMessage += `

Would you like to create this category?`;
  const confirmKeyboard = createInlineKeyboard([
    [
      { text: "\u2705 Yes, Create It", callback_data: "confirm_ai_action" },
      { text: "\u274C Cancel", callback_data: "cancel_ai_action" }
    ]
  ]);
  await sendTelegramMessage(chatId, confirmMessage, confirmKeyboard);
  await storage2.setUserState(chatId, "awaiting_confirmation", {
    action: "create_category",
    categoryName: intent.categoryName,
    categoryColor: intent.categoryColor || "bg-blue-500",
    categoryIcon: intent.categoryIcon || "Tag",
    allocatedFunds: intent.allocatedFunds || 0,
    budgetAmount: intent.budgetAmount
  });
}
async function handleUpdateCategory(chatId, intent, storage2) {
  await sendTelegramMessage(chatId, "This feature is available through the web app. Please use the app to update categories.", createMainMenu());
}
async function handleDeleteCategory(chatId, intent, storage2) {
  await sendTelegramMessage(chatId, "For safety reasons, category deletion is only available through the web app.", createMainMenu());
}
async function handleSetBudget(chatId, intent, storage2) {
  await sendTelegramMessage(chatId, "Budget setting is available through the web app or you can create a category with a budget directly!", createMainMenu());
}
async function handleAddFundsToCategory(chatId, intent, storage2) {
  await sendTelegramMessage(chatId, "Adding funds to categories is available through the web app menu system.", createMainMenu());
}
async function handleResetCategory(chatId, intent, storage2) {
  await sendTelegramMessage(chatId, "Category reset is available through the web app for safety reasons.", createMainMenu());
}
async function handleViewPaymentMethods(chatId, storage2) {
  const allPaymentMethods = await storage2.getAllPaymentMethods();
  if (allPaymentMethods.length === 0) {
    await sendTelegramMessage(chatId, "\u{1F4B3} No payment methods yet. Add one by saying 'Create credit card Chase'!", createMainMenu());
    return;
  }
  let response = `\u{1F4B3} *Payment Methods* (${allPaymentMethods.length})

`;
  for (const method of allPaymentMethods) {
    const balance = method.balance ? parseFloat(method.balance) : 0;
    const typeIcon = method.type === "credit_card" ? "\u{1F4B3}" : method.type === "debit_card" ? "\u{1F3E6}" : method.type === "bank_account" ? "\u{1F3DB}\uFE0F" : "\u{1F4B5}";
    response += `${typeIcon} *${method.name}*
`;
    response += `  Type: ${method.type.replace("_", " ")}
`;
    response += `  Balance: AED ${balance.toFixed(2)}
`;
    if (method.type === "credit_card" && method.creditLimit) {
      const creditLimit = parseFloat(method.creditLimit);
      const utilization = (balance / creditLimit * 100).toFixed(1);
      response += `  Credit Limit: AED ${creditLimit.toFixed(2)}
`;
      response += `  Utilization: ${utilization}%
`;
    }
    if (method.dueDate) {
      response += `  Due Date: Day ${method.dueDate} of month
`;
    }
    response += "\n";
  }
  await sendTelegramMessage(chatId, response, createMainMenu());
}
async function handleCreatePaymentMethod(chatId, intent, storage2) {
  if (!intent.paymentMethodName) {
    await sendTelegramMessage(
      chatId,
      "\u274C Please specify a payment method name.\n\n\u{1F4A1} Example: 'Create credit card Chase'",
      createMainMenu()
    );
    return;
  }
  const existing = await storage2.getPaymentMethodByName(intent.paymentMethodName);
  if (existing) {
    await sendTelegramMessage(chatId, `\u274C Payment method "${intent.paymentMethodName}" already exists!`, createMainMenu());
    return;
  }
  let confirmMessage = `\u{1F914} *Confirm New Payment Method*

\u{1F4B3} Name: ${intent.paymentMethodName}
\u{1F4CB} Type: ${intent.paymentMethodType || "cash"}`;
  if (intent.creditLimit) {
    confirmMessage += `
\u{1F4B0} Credit Limit: AED ${intent.creditLimit.toFixed(2)}`;
  }
  if (intent.dueDate) {
    confirmMessage += `
\u{1F4C5} Due Date: Day ${intent.dueDate}`;
  }
  confirmMessage += `

Would you like to create this payment method?`;
  const confirmKeyboard = createInlineKeyboard([
    [
      { text: "\u2705 Yes, Create It", callback_data: "confirm_ai_action" },
      { text: "\u274C Cancel", callback_data: "cancel_ai_action" }
    ]
  ]);
  await sendTelegramMessage(chatId, confirmMessage, confirmKeyboard);
  await storage2.setUserState(chatId, "awaiting_confirmation", {
    action: "create_payment_method",
    paymentMethodName: intent.paymentMethodName,
    paymentMethodType: intent.paymentMethodType || "cash",
    creditLimit: intent.creditLimit,
    dueDate: intent.dueDate
  });
}
async function handleUpdatePaymentMethod(chatId, intent, storage2) {
  await sendTelegramMessage(chatId, "Payment method updates are available through the web app.", createMainMenu());
}
async function handleDeletePaymentMethod(chatId, intent, storage2) {
  await sendTelegramMessage(chatId, "For safety reasons, payment method deletion is only available through the web app.", createMainMenu());
}
async function handleAddFundsToPaymentMethod(chatId, intent, storage2) {
  await sendTelegramMessage(chatId, "Adding funds to payment methods is available through the web app menu system.", createMainMenu());
}
async function handlePayCreditCard(chatId, intent, storage2) {
  await sendTelegramMessage(chatId, "Credit card payments are available through the web app menu system.", createMainMenu());
}
async function handleViewAnalytics(chatId, storage2, intent) {
  const today = /* @__PURE__ */ new Date();
  let startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  let endDate = today;
  const expenses2 = await storage2.getAllExpenses(startDate, endDate);
  const total = expenses2.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const categoryTotals = /* @__PURE__ */ new Map();
  for (const expense of expenses2) {
    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) || 0) + parseFloat(expense.amount)
    );
  }
  let response = `\u{1F4CA} *Analytics*

`;
  response += `\u{1F4B0} Total: AED ${total.toFixed(2)}
`;
  response += `\u{1F4DD} Expenses: ${expenses2.length}

`;
  if (categoryTotals.size > 0) {
    response += `\u{1F4C1} *Top Categories:*
`;
    const sorted = Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1]);
    for (const [category, amount] of sorted.slice(0, 5)) {
      const percentage = amount / total * 100;
      response += `\u2022 ${category}: AED ${amount.toFixed(2)} (${percentage.toFixed(0)}%)
`;
    }
  }
  await sendTelegramMessage(chatId, response, createMainMenu());
}
function getHelpMessage() {
  return `\u{1F916} *AI Assistant Help*

I can help you manage your expenses naturally! Here's what I can do:

\u{1F4B0} *Expenses*
\u2022 "Spent 50 on food"
\u2022 "Paid 100 for lunch with Chase"
\u2022 "Show my expenses"
\u2022 "Monthly summary"

\u{1F4C1} *Categories*
\u2022 "Create category Food"
\u2022 "Show categories"
\u2022 "Add category Transport with 500 budget"

\u{1F4B3} *Payment Methods*
\u2022 "Create credit card Chase"
\u2022 "Show payment methods"
\u2022 "Add cash wallet"

Just type naturally and I'll understand! I'll always ask for confirmation before making changes. \u{1F60A}`;
}
function getGreetingResponse() {
  return `\u{1F44B} *Hello!* I'm your AI expense tracking assistant.

I can help you track expenses, manage categories, and analyze your spending - all through natural conversation!

Try saying:
\u2022 "I spent 50 AED on groceries"
\u2022 "Show my expenses"
\u2022 "Create category Food"

Or use the menu below! \u{1F60A}`;
}
function getConversationalUnknownResponse(message) {
  return `\u{1F914} I'm not quite sure what you want to do.

Try:
\u2022 "Spent 50 on food" - to add an expense
\u2022 "Show expenses" - to view your spending
\u2022 "Create category Food" - to add a category
\u2022 "Help" - to see all commands

Or use the menu buttons below!`;
}
async function processVoiceMessage(chatId, voiceBuffer, storage2) {
  try {
    await sendTelegramMessage(chatId, "\u{1F399}\uFE0F Transcribing voice message...");
    let transcribedText = "";
    const openai = await getOpenAIClient(storage2);
    if (openai) {
      try {
        console.log("[Telegram AI] Using OpenAI Whisper for voice transcription");
        const file = new File([voiceBuffer], "voice.ogg", { type: "audio/ogg" });
        const transcription = await openai.audio.transcriptions.create({
          file,
          model: "whisper-1",
          language: "en"
        });
        transcribedText = transcription.text;
      } catch (error) {
        console.error("[Telegram AI] OpenAI Whisper failed, falling back to Gemini:", error);
      }
    }
    if (!transcribedText || transcribedText.trim() === "") {
      const ai = await getGeminiAI(storage2);
      if (!ai) {
        await sendTelegramMessage(
          chatId,
          "\u274C Voice transcription requires OpenAI or Gemini AI. Please enable one in settings.",
          createMainMenu()
        );
        return;
      }
      try {
        console.log("[Telegram AI] Using Gemini AI for voice transcription");
        const base64Audio = voiceBuffer.toString("base64");
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: [
            {
              inlineData: {
                mimeType: "audio/ogg",
                data: base64Audio
              }
            },
            "Transcribe this audio to text. Only return the transcribed text, nothing else."
          ]
        });
        transcribedText = response.text?.trim() || "";
      } catch (error) {
        console.error("[Telegram AI] Gemini transcription failed:", error);
      }
    }
    if (!transcribedText || transcribedText.trim() === "") {
      await sendTelegramMessage(
        chatId,
        "\u274C Could not transcribe voice message. Please try again or type your message.",
        createMainMenu()
      );
      return;
    }
    console.log("[Telegram AI] Voice transcribed:", transcribedText);
    const intent = await extractIntent(transcribedText, storage2);
    if (intent.action === "add_expense") {
      if (!intent.amount) {
        await sendTelegramMessage(
          chatId,
          `\u{1F399}\uFE0F *Transcribed:* "${transcribedText}"

\u274C I couldn't find an amount. Please specify how much you spent.

\u{1F4A1} Example: "I spent 50 AED on groceries"`,
          createMainMenu()
        );
        return;
      }
      const suggestedCategory = intent.category || "Other";
      const paymentMethodName = intent.paymentMethod || "Telegram";
      const description = intent.description || transcribedText;
      const expenseDate = intent.date ? new Date(intent.date) : /* @__PURE__ */ new Date();
      const formattedExpenseDate = `${expenseDate.getDate().toString().padStart(2, "0")}/${(expenseDate.getMonth() + 1).toString().padStart(2, "0")}/${expenseDate.getFullYear()}`;
      const confirmMessage = `\u{1F399}\uFE0F *Voice Message Transcribed!*

\u{1F4DD} "${transcribedText}"

\u{1F4B0} Amount: AED ${intent.amount.toFixed(2)}
\u{1F4DD} Description: ${description}
\u{1F4C5} Date: ${formattedExpenseDate}

Would you like to add this expense?`;
      const confirmKeyboard = createInlineKeyboard([
        [
          { text: "\u2705 Yes, Add It", callback_data: "confirm_ai_action" },
          { text: "\u274C Cancel", callback_data: "cancel_ai_action" }
        ]
      ]);
      await sendTelegramMessage(chatId, confirmMessage, confirmKeyboard);
      await storage2.setUserState(chatId, "awaiting_confirmation", {
        action: "add_expense_from_voice",
        amount: intent.amount,
        suggestedCategory,
        paymentMethod: paymentMethodName,
        description,
        date: expenseDate.toISOString(),
        transcribedText
      });
    } else {
      await sendTelegramMessage(
        chatId,
        `\u{1F399}\uFE0F *Transcribed:* "${transcribedText}"

Processing your request...`
      );
      await processTelegramMessage(chatId, transcribedText, storage2);
    }
  } catch (error) {
    console.error("[Telegram AI] Error processing voice message:", error);
    await sendTelegramMessage(
      chatId,
      "\u274C Failed to process voice message. Please try again or type your message.",
      createMainMenu()
    );
  }
}
async function processReceiptPhoto(chatId, base64Image, storage2) {
  try {
    await sendTelegramMessage(chatId, "\u{1F50D} Analyzing receipt...");
    const systemPrompt = `You are a receipt OCR assistant. Extract structured data from receipt images.

Analyze the receipt and return JSON with:
- amount: Total amount (number)
- merchant: Store/merchant name (string)
- category: Best category match from: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Travel, Education, Other
- date: Date in ISO format (YYYY-MM-DD), use today if unclear
- items: Array of item descriptions (up to 5 main items)
- confidence: "high" if all key fields clear, "medium" if some unclear, "low" if very unclear

Return only valid JSON, no markdown.`;
    let receiptData = null;
    const openai = await getOpenAIClient(storage2);
    if (openai) {
      try {
        console.log("[Telegram AI] Using OpenAI Vision for receipt processing");
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
        console.error("[Telegram AI] OpenAI Vision failed, falling back to Gemini:", error);
      }
    }
    if (!receiptData) {
      const ai = await getGeminiAI(storage2);
      if (!ai) {
        await sendTelegramMessage(
          chatId,
          "\u274C AI service is not configured. Please enable OpenAI or Gemini AI in settings.",
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
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          "Extract receipt data from this image."
        ]
      });
      const rawJson = response.text;
      if (!rawJson) {
        await sendTelegramMessage(
          chatId,
          "\u274C Failed to analyze receipt. Please try again.",
          createMainMenu()
        );
        return;
      }
      receiptData = JSON.parse(rawJson);
    }
    if (!receiptData) {
      await sendTelegramMessage(
        chatId,
        "\u274C Failed to analyze receipt. Please try again.",
        createMainMenu()
      );
      return;
    }
    if (receiptData.confidence === "low" || !receiptData.amount) {
      await sendTelegramMessage(
        chatId,
        '\u{1F615} I had trouble reading this receipt clearly. Please try:\n\n\u2022 Taking a clearer photo\n\u2022 Better lighting\n\u2022 Flattening the receipt\n\nOr you can add the expense manually using natural language like "Spent 50 on food"',
        createMainMenu()
      );
      return;
    }
    const suggestedCategory = receiptData.category || "Other";
    const paymentMethodName = "Telegram";
    const description = receiptData.merchant ? `${receiptData.merchant}${receiptData.items && receiptData.items.length > 0 ? ` - ${receiptData.items.slice(0, 2).join(", ")}` : ""}` : "Receipt scan";
    const expenseDate = receiptData.date ? new Date(receiptData.date) : /* @__PURE__ */ new Date();
    const formattedExpenseDate = `${expenseDate.getDate().toString().padStart(2, "0")}/${(expenseDate.getMonth() + 1).toString().padStart(2, "0")}/${expenseDate.getFullYear()}`;
    const confirmMessage = `\u{1F4F8} *Receipt Scanned!*

\u{1F4B0} Amount: AED ${receiptData.amount.toFixed(2)}
` + (receiptData.merchant ? `\u{1F3EA} Merchant: ${receiptData.merchant}
` : "") + `\u{1F4DD} Description: ${description}
\u{1F4C5} Date: ${formattedExpenseDate}

` + (receiptData.items && receiptData.items.length > 0 ? `\u{1F4CB} Items:
${receiptData.items.slice(0, 3).map((item) => `\u2022 ${item}`).join("\n")}

` : "") + `${receiptData.confidence === "medium" ? "\u26A0\uFE0F Medium confidence - please verify\n\n" : ""}Would you like to add this expense?`;
    const confirmKeyboard = createInlineKeyboard([
      [
        { text: "\u2705 Yes, Add It", callback_data: "confirm_ai_action" },
        { text: "\u274C Cancel", callback_data: "cancel_ai_action" }
      ]
    ]);
    await sendTelegramMessage(chatId, confirmMessage, confirmKeyboard);
    await storage2.setUserState(chatId, "awaiting_confirmation", {
      action: "add_expense_from_receipt",
      amount: receiptData.amount,
      suggestedCategory,
      paymentMethod: paymentMethodName,
      description,
      date: expenseDate.toISOString()
    });
  } catch (error) {
    console.error("[Telegram AI] Error processing receipt photo:", error);
    await sendTelegramMessage(
      chatId,
      "\u274C Failed to process receipt. Please try again or add the expense manually.",
      createMainMenu()
    );
  }
}
var init_telegram_ai = __esm({
  "server/telegram-ai.ts"() {
    "use strict";
    init_telegram_bot();
  }
});

// server/telegram-notifications.ts
var telegram_notifications_exports = {};
__export(telegram_notifications_exports, {
  notifyTelegramCategoryCreated: () => notifyTelegramCategoryCreated,
  notifyTelegramExpenseCreated: () => notifyTelegramExpenseCreated,
  notifyTelegramPaymentMethodCreated: () => notifyTelegramPaymentMethodCreated
});
function escapeMarkdown(text2) {
  return text2.replace(/([_*\[\]()~`>#+=|{}.!])/g, "\\$1");
}
function getEmojiForIcon2(iconName) {
  const iconMap = {
    "Building2": "\u{1F3E2}",
    "Building": "\u{1F3E2}",
    "ShoppingCart": "\u{1F6D2}",
    "ShoppingBag": "\u{1F6CD}\uFE0F",
    "Utensils": "\u{1F37D}\uFE0F",
    "Coffee": "\u2615",
    "Car": "\u{1F697}",
    "Bus": "\u{1F68C}",
    "Plane": "\u2708\uFE0F",
    "Home": "\u{1F3E0}",
    "Heart": "\u2764\uFE0F",
    "Zap": "\u26A1",
    "Gamepad2": "\u{1F3AE}",
    "Film": "\u{1F3AC}",
    "Music": "\u{1F3B5}",
    "Book": "\u{1F4DA}",
    "GraduationCap": "\u{1F393}",
    "Briefcase": "\u{1F4BC}",
    "DollarSign": "\u{1F4B5}",
    "CreditCard": "\u{1F4B3}",
    "Wallet": "\u{1F45B}",
    "Gift": "\u{1F381}",
    "Tag": "\u{1F3F7}\uFE0F",
    "Package": "\u{1F4E6}",
    "Truck": "\u{1F69A}",
    "Phone": "\u{1F4F1}",
    "Laptop": "\u{1F4BB}",
    "Monitor": "\u{1F5A5}\uFE0F",
    "Watch": "\u231A",
    "Activity": "\u{1F4CA}",
    "TrendingUp": "\u{1F4C8}",
    "Wrench": "\u{1F527}",
    "Hammer": "\u{1F528}",
    "Pill": "\u{1F48A}",
    "Stethoscope": "\u{1FA7A}",
    "Dumbbell": "\u{1F3CB}\uFE0F",
    "Pizza": "\u{1F355}",
    "Beer": "\u{1F37A}",
    "Wine": "\u{1F377}",
    "Shirt": "\u{1F455}",
    "Scissors": "\u2702\uFE0F",
    "Sparkles": "\u2728"
  };
  return iconMap[iconName || ""] || "\u{1F3F7}\uFE0F";
}
async function notifyTelegramExpenseCreated(expense, storage2) {
  try {
    const config = await storage2.getTelegramBotConfig();
    if (!config || !config.isEnabled || !config.botToken) {
      return;
    }
    const chatWhitelist = config.chatWhitelist || [];
    if (chatWhitelist.length === 0) {
      return;
    }
    const paymentMethod = await storage2.getPaymentMethod(expense.paymentMethod);
    const paymentName = paymentMethod?.name || "Unknown";
    const typeEmoji = paymentMethod ? {
      cash: "\u{1F4B5}",
      credit_card: "\u{1F4B3}",
      debit_card: "\u{1F3E6}",
      bank_transfer: "\u{1F3DB}\uFE0F",
      digital_wallet: "\u{1F4F1}"
    }[paymentMethod.type] || "\u{1F4B0}" : "\u{1F4B0}";
    const date = new Date(expense.date);
    const formattedDate = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
    const category = await storage2.getCategoryByName(expense.category);
    let categoryInfo = "";
    if (category) {
      const categoryFundHistory = await storage2.getFundHistoryByCategory(category.id);
      const totalAllocated = categoryFundHistory.reduce((sum, f) => sum + parseFloat(f.amount), 0);
      const allExpenses = await storage2.getAllExpenses();
      const categoryExpenses = allExpenses.filter((e) => e.category.trim() === expense.category.trim());
      const totalSpent = categoryExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const available = totalAllocated - totalSpent;
      categoryInfo = `\u{1F4CA} Total spend: *AED ${totalSpent.toFixed(2)}*
\u2705 Available: *AED ${available.toFixed(2)}*`;
    }
    let paymentInfo = "";
    if (paymentMethod) {
      const currentBalance = parseFloat(paymentMethod.balance || "0");
      const allExpenses = await storage2.getAllExpenses();
      const paymentExpenses = allExpenses.filter((e) => e.paymentMethod === paymentMethod.name);
      const paymentTotalSpent = paymentExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      paymentInfo = `\u{1F4CA} Total spend: *AED ${paymentTotalSpent.toFixed(2)}*
\u2705 Available: *AED ${currentBalance.toFixed(2)}*`;
    }
    const message = `\u{1F4B0} *New Expense Added*

\u{1F3F7}\uFE0F Category: ${escapeMarkdown(expense.category)}
\u{1F4B5} Amount: *AED ${parseFloat(expense.amount).toFixed(2)}*
\u{1F4DD} Description: ${escapeMarkdown(expense.description)}
${categoryInfo}

${typeEmoji} Payment: ${escapeMarkdown(paymentName)}
${paymentInfo}
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F4C5} Date: ${formattedDate}`;
    for (const chatId of chatWhitelist) {
      try {
        await sendTelegramMessage(chatId, message);
      } catch (error) {
        console.error(`[Telegram Notification] Failed to send to ${chatId}:`, error);
      }
    }
  } catch (error) {
    console.error("[Telegram Notification] Error notifying expense:", error);
  }
}
async function notifyTelegramCategoryCreated(category, storage2) {
  try {
    const config = await storage2.getTelegramBotConfig();
    if (!config || !config.isEnabled || !config.botToken) {
      return;
    }
    const chatWhitelist = config.chatWhitelist || [];
    if (chatWhitelist.length === 0) {
      return;
    }
    const icon = getEmojiForIcon2(category.icon);
    const message = `\u{1F3F7}\uFE0F *New Category Created*

${icon} Name: *${escapeMarkdown(category.name)}*
\u{1F4B0} Allocated Funds: AED ${parseFloat(category.allocatedFunds || "0").toFixed(2)}` + (category.budget ? `
\u{1F4CA} Budget: AED ${parseFloat(category.budget).toFixed(2)}` : "");
    for (const chatId of chatWhitelist) {
      try {
        await sendTelegramMessage(chatId, message);
      } catch (error) {
        console.error(`[Telegram Notification] Failed to send to ${chatId}:`, error);
      }
    }
  } catch (error) {
    console.error("[Telegram Notification] Error notifying category:", error);
  }
}
async function notifyTelegramPaymentMethodCreated(paymentMethod, storage2) {
  try {
    const config = await storage2.getTelegramBotConfig();
    if (!config || !config.isEnabled || !config.botToken) {
      return;
    }
    const chatWhitelist = config.chatWhitelist || [];
    if (chatWhitelist.length === 0) {
      return;
    }
    const typeEmoji = {
      cash: "\u{1F4B5}",
      credit_card: "\u{1F4B3}",
      debit_card: "\u{1F3E6}",
      bank_transfer: "\u{1F3DB}\uFE0F",
      digital_wallet: "\u{1F4F1}"
    }[paymentMethod.type] || "\u{1F4B0}";
    const typeName = paymentMethod.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    const message = `${typeEmoji} *New Payment Method Created*

${typeEmoji} Name: *${escapeMarkdown(paymentMethod.name)}*
\u{1F4CB} Type: ${typeName}
\u{1F4B0} Balance: AED ${parseFloat(paymentMethod.balance || "0").toFixed(2)}` + (paymentMethod.creditLimit ? `
\u{1F4B3} Credit Limit: AED ${parseFloat(paymentMethod.creditLimit).toFixed(2)}` : "");
    for (const chatId of chatWhitelist) {
      try {
        await sendTelegramMessage(chatId, message);
      } catch (error) {
        console.error(`[Telegram Notification] Failed to send to ${chatId}:`, error);
      }
    }
  } catch (error) {
    console.error("[Telegram Notification] Error notifying payment method:", error);
  }
}
var init_telegram_notifications = __esm({
  "server/telegram-notifications.ts"() {
    "use strict";
    init_telegram_bot();
  }
});

// shared/constants.ts
var constants_exports = {};
__export(constants_exports, {
  CATEGORY_COLORS: () => CATEGORY_COLORS,
  CATEGORY_GRADIENT_COLORS: () => CATEGORY_GRADIENT_COLORS,
  CATEGORY_ICONS: () => CATEGORY_ICONS,
  COLOR_OPTIONS: () => COLOR_OPTIONS,
  DEFAULT_CATEGORIES: () => DEFAULT_CATEGORIES,
  ICON_OPTIONS: () => ICON_OPTIONS,
  PAYMENT_METHODS: () => PAYMENT_METHODS
});
var DEFAULT_CATEGORIES, CATEGORY_COLORS, CATEGORY_GRADIENT_COLORS, COLOR_OPTIONS, ICON_OPTIONS, CATEGORY_ICONS, PAYMENT_METHODS;
var init_constants = __esm({
  "shared/constants.ts"() {
    "use strict";
    DEFAULT_CATEGORIES = [
      "Food & Dining",
      "Transportation",
      "Shopping",
      "Entertainment",
      "Bills & Utilities",
      "Healthcare",
      "Travel",
      "Education",
      "Other"
    ];
    CATEGORY_COLORS = {
      "Food & Dining": "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
      "Transportation": "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
      "Shopping": "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
      "Entertainment": "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
      "Bills & Utilities": "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
      "Healthcare": "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
      "Travel": "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
      "Education": "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
      "Other": "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800"
    };
    CATEGORY_GRADIENT_COLORS = {
      "Food & Dining": "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
      "Transportation": "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
      "Shopping": "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
      "Entertainment": "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
      "Bills & Utilities": "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
      "Healthcare": "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
      "Travel": "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
      "Education": "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
      "Other": "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800"
    };
    COLOR_OPTIONS = [
      { value: "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800", label: "Orange" },
      { value: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800", label: "Blue" },
      { value: "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800", label: "Purple" },
      { value: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800", label: "Emerald" },
      { value: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800", label: "Rose" },
      { value: "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800", label: "Teal" },
      { value: "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800", label: "Sky" },
      { value: "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800", label: "Violet" },
      { value: "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800", label: "Slate" }
    ];
    ICON_OPTIONS = [
      { value: "Utensils", label: "Food & Dining" },
      { value: "Car", label: "Transportation" },
      { value: "ShoppingBag", label: "Shopping" },
      { value: "Gamepad2", label: "Entertainment" },
      { value: "Zap", label: "Bills & Utilities" },
      { value: "Heart", label: "Healthcare" },
      { value: "Plane", label: "Travel" },
      { value: "GraduationCap", label: "Education" },
      { value: "Tag", label: "Other" },
      { value: "Home", label: "Home" },
      { value: "Coffee", label: "Coffee" },
      { value: "Fuel", label: "Fuel" },
      { value: "Dumbbell", label: "Fitness" },
      { value: "Music", label: "Music" },
      { value: "Camera", label: "Photography" },
      { value: "Book", label: "Books" },
      { value: "Gift", label: "Gifts" },
      { value: "Smartphone", label: "Technology" },
      { value: "Briefcase", label: "Business" },
      { value: "Building2", label: "Company" },
      { value: "Shirt", label: "Clothing" },
      { value: "Pizza", label: "Fast Food" },
      { value: "Banknote", label: "Cash" },
      { value: "CreditCard", label: "Credit Card" },
      { value: "Landmark", label: "Bank" },
      { value: "Receipt", label: "Receipt" },
      { value: "Wallet", label: "Wallet" },
      { value: "PiggyBank", label: "Savings" },
      { value: "TrendingUp", label: "Investment" },
      { value: "DollarSign", label: "Money" },
      { value: "ShoppingCart", label: "Groceries" },
      { value: "Tv", label: "TV & Streaming" },
      { value: "Film", label: "Movies" },
      { value: "Popcorn", label: "Snacks" },
      { value: "Beer", label: "Drinks" },
      { value: "Wine", label: "Wine & Spirits" },
      { value: "Bike", label: "Cycling" },
      { value: "Bus", label: "Public Transit" },
      { value: "Train", label: "Train" },
      { value: "Ship", label: "Ferry" },
      { value: "Taxi", label: "Taxi" },
      { value: "Hotel", label: "Hotel" },
      { value: "Palmtree", label: "Vacation" },
      { value: "MapPin", label: "Location" },
      { value: "Wifi", label: "Internet" },
      { value: "Phone", label: "Phone" },
      { value: "Mail", label: "Postal" },
      { value: "Newspaper", label: "Subscriptions" },
      { value: "Scissors", label: "Haircut & Beauty" },
      { value: "Wrench", label: "Maintenance" },
      { value: "Hammer", label: "Repairs" },
      { value: "PaintBucket", label: "Home Improvement" },
      { value: "Sofa", label: "Furniture" },
      { value: "Lamp", label: "Electronics" },
      { value: "Dog", label: "Pets" },
      { value: "Cat", label: "Pet Care" },
      { value: "Baby", label: "Baby & Kids" },
      { value: "Stethoscope", label: "Medical" },
      { value: "Pill", label: "Pharmacy" },
      { value: "Activity", label: "Sports" },
      { value: "Trophy", label: "Hobbies" },
      { value: "Palette", label: "Art & Craft" },
      { value: "Users", label: "Family" },
      { value: "User", label: "Personal" },
      { value: "Sparkles", label: "Luxury" },
      { value: "Leaf", label: "Garden" },
      { value: "Trees", label: "Nature" },
      { value: "Umbrella", label: "Insurance" },
      { value: "Scale", label: "Legal" },
      { value: "FileText", label: "Documents" },
      { value: "Calendar", label: "Events" },
      { value: "PartyPopper", label: "Celebrations" }
    ];
    CATEGORY_ICONS = {
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
    PAYMENT_METHODS = [
      { value: "cash", label: "Cash", icon: "Banknote" },
      { value: "credit_card", label: "Credit Card", icon: "CreditCard" },
      { value: "debit_card", label: "Debit Card", icon: "CreditCard" }
    ];
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  categories: () => categories,
  expenses: () => expenses,
  fundHistory: () => fundHistory,
  geminiConfigs: () => geminiConfigs,
  insertCategorySchema: () => insertCategorySchema,
  insertExpenseSchema: () => insertExpenseSchema,
  insertFundHistorySchema: () => insertFundHistorySchema,
  insertGeminiConfigSchema: () => insertGeminiConfigSchema,
  insertOpenAIConfigSchema: () => insertOpenAIConfigSchema,
  insertPaymentMethodFundHistorySchema: () => insertPaymentMethodFundHistorySchema,
  insertPaymentMethodSchema: () => insertPaymentMethodSchema,
  insertTelegramBotConfigSchema: () => insertTelegramBotConfigSchema,
  openaiConfigs: () => openaiConfigs,
  paymentMethodFundHistory: () => paymentMethodFundHistory,
  paymentMethods: () => paymentMethods,
  telegramBotConfigs: () => telegramBotConfigs,
  telegramUserStates: () => telegramUserStates
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  color: text("color").notNull(),
  // Store the color class for the category
  budget: decimal("budget", { precision: 10, scale: 2 }),
  // Legacy budget field (keeping for backward compatibility)
  allocatedFunds: decimal("allocated_funds", { precision: 10, scale: 2 }).default("0"),
  // Allocated funds for this category
  icon: text("icon").default("Tag"),
  // Lucide icon name
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var fundHistory = pgTable("fund_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  // Optional description for the fund addition
  addedAt: timestamp("added_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  // e.g. "Chase Credit Card", "My Cash Wallet" 
  type: text("type").notNull(),
  // cash, credit_card, debit_card, bank_transfer, digital_wallet
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0"),
  maxBalance: decimal("max_balance", { precision: 10, scale: 2 }).default("0"),
  // Track highest balance for progress bars
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }),
  dueDate: integer("due_date"),
  // Day of month (1-31) when credit card payment is due
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var paymentMethodFundHistory = pgTable("payment_method_fund_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentMethodId: varchar("payment_method_id").notNull().references(() => paymentMethods.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  // Optional description for the fund addition
  addedAt: timestamp("added_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});
var expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  paymentMethod: text("payment_method").notNull(),
  date: timestamp("date").notNull().defaultNow()
});
var telegramBotConfigs = pgTable("telegram_bot_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  botToken: text("bot_token"),
  // Encrypted bot token
  webhookSecret: text("webhook_secret"),
  // Secret token for webhook validation
  chatWhitelist: text("chat_whitelist").array().default(sql`'{}'::text[]`),
  // Array of allowed chat IDs
  isEnabled: boolean("is_enabled").default(false),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var telegramUserStates = pgTable("telegram_user_states", {
  chatId: text("chat_id").primaryKey(),
  state: text("state"),
  // Current conversation state (add_expense, add_fund, make_payment, etc.)
  data: text("data"),
  // JSON data for the current flow
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var geminiConfigs = pgTable("gemini_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  apiKey: text("api_key"),
  isEnabled: boolean("is_enabled").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var openaiConfigs = pgTable("openai_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  apiKey: text("api_key"),
  isEnabled: boolean("is_enabled").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
var insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  name: z.string().trim().min(1, "Category name is required"),
  allocatedFunds: z.coerce.number().min(0, "Allocated funds must be non-negative").optional()
});
var insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true
}).extend({
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().trim().min(1, "Description is required"),
  date: z.coerce.date(),
  paymentMethod: z.string().trim().min(1, "Payment method is required")
});
var insertFundHistorySchema = createInsertSchema(fundHistory).omit({
  id: true,
  createdAt: true
}).extend({
  amount: z.coerce.number().positive("Amount must be positive"),
  addedAt: z.coerce.date()
});
var insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  name: z.string().trim().min(1, "Payment method name is required"),
  type: z.enum(["cash", "credit_card", "debit_card", "bank_transfer", "digital_wallet"], {
    errorMap: () => ({ message: "Please select a valid payment method type" })
  }),
  balance: z.coerce.number().optional(),
  creditLimit: z.coerce.number().positive().optional(),
  dueDate: z.coerce.number().int().min(1).max(31).optional(),
  isActive: z.boolean().optional()
});
var insertPaymentMethodFundHistorySchema = createInsertSchema(paymentMethodFundHistory).omit({
  id: true,
  createdAt: true
}).extend({
  amount: z.coerce.number().positive("Amount must be positive"),
  addedAt: z.coerce.date()
});
var insertTelegramBotConfigSchema = createInsertSchema(telegramBotConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  botToken: z.string().optional(),
  webhookSecret: z.string().optional(),
  chatWhitelist: z.array(z.string()).optional(),
  isEnabled: z.boolean().optional()
});
var insertGeminiConfigSchema = createInsertSchema(geminiConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  apiKey: z.string().optional(),
  isEnabled: z.boolean().optional()
});
var insertOpenAIConfigSchema = createInsertSchema(openaiConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  apiKey: z.string().optional(),
  isEnabled: z.boolean().optional()
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 1e4
});
pool.on("error", (err) => {
  console.error("Unexpected error on idle database client", err);
});
process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, sql as sql2, and, gte, lte } from "drizzle-orm";
function toDecimalString(value) {
  if (typeof value === "string") return value;
  return value.toString();
}
function toNumber(value) {
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    throw new Error(`Cannot convert "${value}" to number`);
  }
  return parsed;
}
var DatabaseStorage = class {
  async getAllExpenses(startDate, endDate) {
    const conditions = [];
    if (startDate) {
      conditions.push(gte(expenses.date, startDate));
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(lte(expenses.date, endOfDay));
    }
    if (conditions.length > 0) {
      return await db.select().from(expenses).where(and(...conditions)).orderBy(desc(expenses.date));
    }
    return await db.select().from(expenses).orderBy(desc(expenses.date));
  }
  async getExpense(id) {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || void 0;
  }
  async createExpense(insertExpense) {
    return await db.transaction(async (tx) => {
      const [expense] = await tx.insert(expenses).values({
        ...insertExpense,
        amount: toDecimalString(insertExpense.amount)
      }).returning();
      const category = await this.getCategoryByName(insertExpense.category, tx);
      if (category) {
        await tx.update(categories).set({
          allocatedFunds: sql2`allocated_funds - ${toDecimalString(insertExpense.amount)}`,
          updatedAt: sql2`NOW()`
        }).where(eq(categories.id, category.id));
      }
      if (insertExpense.paymentMethod) {
        await tx.update(paymentMethods).set({
          balance: sql2`balance - ${toDecimalString(insertExpense.amount)}`,
          updatedAt: sql2`NOW()`
        }).where(eq(paymentMethods.id, insertExpense.paymentMethod));
      }
      return expense;
    });
  }
  async updateExpense(id, updateData) {
    return await db.transaction(async (tx) => {
      const [oldExpense] = await tx.select().from(expenses).where(eq(expenses.id, id));
      if (!oldExpense) return void 0;
      const updateValues = { ...updateData };
      if (updateData.amount !== void 0) {
        updateValues.amount = toDecimalString(updateData.amount);
      }
      const [expense] = await tx.update(expenses).set(updateValues).where(eq(expenses.id, id)).returning();
      if (!expense) return void 0;
      const oldCategory = await this.getCategoryByName(oldExpense.category, tx);
      const newCategory = updateData.category ? await this.getCategoryByName(updateData.category, tx) : oldCategory;
      const newAmount = updateData.amount ?? parseFloat(oldExpense.amount);
      if (oldCategory) {
        await tx.update(categories).set({
          allocatedFunds: sql2`allocated_funds + ${oldExpense.amount}`,
          updatedAt: sql2`NOW()`
        }).where(eq(categories.id, oldCategory.id));
      }
      if (newCategory) {
        await tx.update(categories).set({
          allocatedFunds: sql2`allocated_funds - ${toDecimalString(newAmount)}`,
          updatedAt: sql2`NOW()`
        }).where(eq(categories.id, newCategory.id));
      }
      const oldPaymentMethod = oldExpense.paymentMethod;
      const newPaymentMethod = updateData.paymentMethod ?? oldPaymentMethod;
      if (oldPaymentMethod) {
        await tx.update(paymentMethods).set({
          balance: sql2`balance + ${oldExpense.amount}`,
          updatedAt: sql2`NOW()`
        }).where(eq(paymentMethods.id, oldPaymentMethod));
      }
      if (newPaymentMethod) {
        await tx.update(paymentMethods).set({
          balance: sql2`balance - ${toDecimalString(newAmount)}`,
          updatedAt: sql2`NOW()`
        }).where(eq(paymentMethods.id, newPaymentMethod));
      }
      return expense;
    });
  }
  async deleteExpense(id) {
    return await db.transaction(async (tx) => {
      const [expense] = await tx.select().from(expenses).where(eq(expenses.id, id));
      if (!expense) return false;
      const result = await tx.delete(expenses).where(eq(expenses.id, id));
      const deleted = (result.rowCount || 0) > 0;
      if (deleted) {
        const category = await this.getCategoryByName(expense.category, tx);
        if (category) {
          await tx.update(categories).set({
            allocatedFunds: sql2`allocated_funds + ${expense.amount}`,
            updatedAt: sql2`NOW()`
          }).where(eq(categories.id, category.id));
        }
        if (expense.paymentMethod) {
          await tx.update(paymentMethods).set({
            balance: sql2`balance + ${expense.amount}`,
            updatedAt: sql2`NOW()`
          }).where(eq(paymentMethods.id, expense.paymentMethod));
        }
      }
      return deleted;
    });
  }
  // Category management methods
  async getAllCategories() {
    return await db.select().from(categories).orderBy(categories.name);
  }
  async getCategory(id) {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || void 0;
  }
  async getCategoryByName(name, tx) {
    const dbInstance = tx || db;
    const [category] = await dbInstance.select().from(categories).where(eq(categories.name, name));
    return category || void 0;
  }
  async createCategory(insertCategory) {
    const categoryValues = {
      ...insertCategory,
      updatedAt: sql2`NOW()`
    };
    if (insertCategory.allocatedFunds !== void 0) {
      categoryValues.allocatedFunds = toDecimalString(insertCategory.allocatedFunds);
    }
    const [category] = await db.insert(categories).values(categoryValues).returning();
    return category;
  }
  async updateCategory(id, updateData) {
    const updateValues = {
      ...updateData,
      updatedAt: sql2`NOW()`
    };
    if (updateData.allocatedFunds !== void 0) {
      updateValues.allocatedFunds = toDecimalString(updateData.allocatedFunds);
    }
    const [category] = await db.update(categories).set(updateValues).where(eq(categories.id, id)).returning();
    return category || void 0;
  }
  async deleteCategory(id) {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount || 0) > 0;
  }
  // =============== FUND HISTORY METHODS ===============
  async getAllFundHistory() {
    return await db.select().from(fundHistory).orderBy(desc(fundHistory.addedAt));
  }
  async getFundHistory(id) {
    const [history] = await db.select().from(fundHistory).where(eq(fundHistory.id, id));
    return history || void 0;
  }
  async getFundHistoryByCategory(categoryId) {
    return await db.select().from(fundHistory).where(eq(fundHistory.categoryId, categoryId)).orderBy(desc(fundHistory.addedAt));
  }
  async createFundHistory(insertFundHistory) {
    const historyValues = {
      ...insertFundHistory,
      amount: toDecimalString(insertFundHistory.amount)
    };
    const [history] = await db.insert(fundHistory).values(historyValues).returning();
    return history;
  }
  async updateFundHistory(id, updateData) {
    return await db.transaction(async (tx) => {
      const [oldHistory] = await tx.select().from(fundHistory).where(eq(fundHistory.id, id));
      if (!oldHistory) return void 0;
      const updateValues = { ...updateData };
      if (updateData.amount !== void 0) {
        updateValues.amount = toDecimalString(updateData.amount);
      }
      const [updatedHistory] = await tx.update(fundHistory).set(updateValues).where(eq(fundHistory.id, id)).returning();
      if (!updatedHistory) return void 0;
      const oldCategoryId = oldHistory.categoryId;
      const newCategoryId = updateData.categoryId ?? oldHistory.categoryId;
      const oldAmount = oldHistory.amount;
      const newAmount = updateData.amount !== void 0 ? toDecimalString(updateData.amount) : oldHistory.amount;
      if (oldCategoryId !== newCategoryId) {
        await tx.update(categories).set({
          allocatedFunds: sql2`allocated_funds - ${oldAmount}`,
          updatedAt: sql2`NOW()`
        }).where(eq(categories.id, oldCategoryId));
        await tx.update(categories).set({
          allocatedFunds: sql2`allocated_funds + ${newAmount}`,
          updatedAt: sql2`NOW()`
        }).where(eq(categories.id, newCategoryId));
      } else if (updateData.amount !== void 0) {
        await tx.update(categories).set({
          allocatedFunds: sql2`allocated_funds + (${newAmount} - ${oldAmount})`,
          updatedAt: sql2`NOW()`
        }).where(eq(categories.id, oldCategoryId));
      }
      return updatedHistory;
    });
  }
  async deleteFundHistory(id) {
    return await db.transaction(async (tx) => {
      const [history] = await tx.select().from(fundHistory).where(eq(fundHistory.id, id));
      if (!history) return false;
      const result = await tx.delete(fundHistory).where(eq(fundHistory.id, id));
      const deleted = (result.rowCount || 0) > 0;
      if (deleted) {
        await tx.update(categories).set({
          allocatedFunds: sql2`allocated_funds - ${history.amount}`,
          updatedAt: sql2`NOW()`
        }).where(eq(categories.id, history.categoryId));
      }
      return deleted;
    });
  }
  async addFundsToCategory(categoryId, amount, description) {
    return await db.transaction(async (tx) => {
      const [history] = await tx.insert(fundHistory).values({
        categoryId,
        amount: toDecimalString(amount),
        description: description || null,
        addedAt: /* @__PURE__ */ new Date()
      }).returning();
      const [updatedCategory] = await tx.update(categories).set({
        allocatedFunds: sql2`allocated_funds + ${toDecimalString(amount)}`,
        updatedAt: sql2`NOW()`
      }).where(eq(categories.id, categoryId)).returning();
      if (!updatedCategory) {
        throw new Error("Category not found");
      }
      return { fundHistory: history, updatedCategory };
    });
  }
  // Payment Method management methods
  async getAllPaymentMethods() {
    return await db.select().from(paymentMethods).orderBy(desc(paymentMethods.createdAt));
  }
  async getPaymentMethod(id) {
    const [paymentMethod] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
    return paymentMethod || void 0;
  }
  async getPaymentMethodByName(name) {
    const [paymentMethod] = await db.select().from(paymentMethods).where(eq(paymentMethods.name, name));
    return paymentMethod || void 0;
  }
  async createPaymentMethod(insertPaymentMethod) {
    const balance = insertPaymentMethod.balance ? toDecimalString(insertPaymentMethod.balance) : "0";
    const [paymentMethod] = await db.insert(paymentMethods).values({
      ...insertPaymentMethod,
      balance,
      maxBalance: balance,
      // Set maxBalance to initial balance
      creditLimit: insertPaymentMethod.creditLimit ? toDecimalString(insertPaymentMethod.creditLimit) : null,
      updatedAt: sql2`NOW()`
    }).returning();
    return paymentMethod;
  }
  async updatePaymentMethod(id, updatePaymentMethod) {
    return await db.transaction(async (tx) => {
      const [currentPaymentMethod] = await tx.select().from(paymentMethods).where(eq(paymentMethods.id, id));
      if (!currentPaymentMethod) return void 0;
      const updateData = {
        ...updatePaymentMethod,
        updatedAt: sql2`NOW()`
      };
      if (updatePaymentMethod.balance !== void 0) {
        updateData.balance = toDecimalString(updatePaymentMethod.balance);
        const newBalance = toNumber(updateData.balance);
        const currentMaxBalance = toNumber(currentPaymentMethod.maxBalance || "0");
        if (newBalance > currentMaxBalance) {
          updateData.maxBalance = toDecimalString(newBalance);
        }
      }
      if (updatePaymentMethod.creditLimit !== void 0) {
        updateData.creditLimit = updatePaymentMethod.creditLimit ? toDecimalString(updatePaymentMethod.creditLimit) : null;
      }
      const [paymentMethod] = await tx.update(paymentMethods).set(updateData).where(eq(paymentMethods.id, id)).returning();
      return paymentMethod || void 0;
    });
  }
  async deletePaymentMethod(id) {
    const result = await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
    return (result.rowCount || 0) > 0;
  }
  async addFundsToPaymentMethod(paymentMethodId, amount, description) {
    return await db.transaction(async (tx) => {
      const [existingPaymentMethod] = await tx.select().from(paymentMethods).where(eq(paymentMethods.id, paymentMethodId));
      if (!existingPaymentMethod) {
        throw new Error("Payment method not found");
      }
      const [history] = await tx.insert(paymentMethodFundHistory).values({
        paymentMethodId,
        amount: toDecimalString(amount),
        description: description || null,
        addedAt: /* @__PURE__ */ new Date()
      }).returning();
      const [updatedPaymentMethod] = await tx.update(paymentMethods).set({
        balance: sql2`balance + ${toDecimalString(amount)}`,
        maxBalance: sql2`CASE WHEN balance + ${toDecimalString(amount)} > max_balance THEN balance + ${toDecimalString(amount)} ELSE max_balance END`,
        updatedAt: sql2`NOW()`
      }).where(eq(paymentMethods.id, paymentMethodId)).returning();
      if (!updatedPaymentMethod) {
        throw new Error("Payment method not found");
      }
      return { fundHistory: history, updatedPaymentMethod };
    });
  }
  async getAllPaymentMethodFundHistory() {
    return await db.select().from(paymentMethodFundHistory).orderBy(desc(paymentMethodFundHistory.addedAt));
  }
  async getPaymentMethodFundHistory(id) {
    const [history] = await db.select().from(paymentMethodFundHistory).where(eq(paymentMethodFundHistory.id, id));
    return history || void 0;
  }
  async getPaymentMethodFundHistoryByPaymentMethod(paymentMethodId) {
    return await db.select().from(paymentMethodFundHistory).where(eq(paymentMethodFundHistory.paymentMethodId, paymentMethodId)).orderBy(desc(paymentMethodFundHistory.addedAt));
  }
  async createPaymentMethodFundHistory(insertFundHistory) {
    const historyValues = {
      ...insertFundHistory,
      amount: toDecimalString(insertFundHistory.amount)
    };
    const [history] = await db.insert(paymentMethodFundHistory).values(historyValues).returning();
    return history;
  }
  async updatePaymentMethodFundHistory(id, updateData) {
    return await db.transaction(async (tx) => {
      const [oldHistory] = await tx.select().from(paymentMethodFundHistory).where(eq(paymentMethodFundHistory.id, id));
      if (!oldHistory) return void 0;
      const updateValues = { ...updateData };
      if (updateData.amount !== void 0) {
        updateValues.amount = toDecimalString(updateData.amount);
      }
      const [updatedHistory] = await tx.update(paymentMethodFundHistory).set(updateValues).where(eq(paymentMethodFundHistory.id, id)).returning();
      if (!updatedHistory) return void 0;
      const oldPaymentMethodId = oldHistory.paymentMethodId;
      const newPaymentMethodId = updateData.paymentMethodId ?? oldHistory.paymentMethodId;
      const oldAmount = oldHistory.amount;
      const newAmount = updateData.amount !== void 0 ? toDecimalString(updateData.amount) : oldHistory.amount;
      if (oldPaymentMethodId !== newPaymentMethodId) {
        await tx.update(paymentMethods).set({
          balance: sql2`balance - ${oldAmount}`,
          updatedAt: sql2`NOW()`
        }).where(eq(paymentMethods.id, oldPaymentMethodId));
        await tx.update(paymentMethods).set({
          balance: sql2`balance + ${newAmount}`,
          updatedAt: sql2`NOW()`
        }).where(eq(paymentMethods.id, newPaymentMethodId));
      } else if (updateData.amount !== void 0) {
        await tx.update(paymentMethods).set({
          balance: sql2`balance + (${newAmount} - ${oldAmount})`,
          updatedAt: sql2`NOW()`
        }).where(eq(paymentMethods.id, oldPaymentMethodId));
      }
      return updatedHistory;
    });
  }
  async deletePaymentMethodFundHistory(id) {
    return await db.transaction(async (tx) => {
      const [history] = await tx.select().from(paymentMethodFundHistory).where(eq(paymentMethodFundHistory.id, id));
      if (!history) return false;
      const result = await tx.delete(paymentMethodFundHistory).where(eq(paymentMethodFundHistory.id, id));
      const deleted = (result.rowCount || 0) > 0;
      if (deleted) {
        await tx.update(paymentMethods).set({
          balance: sql2`balance - ${history.amount}`,
          updatedAt: sql2`NOW()`
        }).where(eq(paymentMethods.id, history.paymentMethodId));
      }
      return deleted;
    });
  }
  async resetCategory(categoryId) {
    return await db.transaction(async (tx) => {
      const [category] = await tx.select().from(categories).where(eq(categories.id, categoryId));
      if (!category) {
        throw new Error("Category not found");
      }
      const categoryExpenses = await tx.select().from(expenses).where(eq(expenses.category, category.name));
      let deletedExpensesCount = 0;
      for (const expense of categoryExpenses) {
        const result = await tx.delete(expenses).where(eq(expenses.id, expense.id));
        if ((result.rowCount || 0) > 0) {
          deletedExpensesCount++;
        }
      }
      const categoryFundHistory = await tx.select().from(fundHistory).where(eq(fundHistory.categoryId, categoryId));
      let deletedFundHistoryCount = 0;
      for (const history of categoryFundHistory) {
        const result = await tx.delete(fundHistory).where(eq(fundHistory.id, history.id));
        if ((result.rowCount || 0) > 0) {
          deletedFundHistoryCount++;
        }
      }
      const [resetCategory] = await tx.update(categories).set({
        allocatedFunds: "0",
        updatedAt: sql2`NOW()`
      }).where(eq(categories.id, categoryId)).returning();
      return {
        deletedExpenses: deletedExpensesCount,
        deletedFundHistory: deletedFundHistoryCount,
        resetCategory
      };
    });
  }
  async clearAllData() {
    await db.transaction(async (tx) => {
      await tx.delete(expenses);
      await tx.delete(fundHistory);
      await tx.delete(paymentMethodFundHistory);
      await tx.delete(paymentMethods);
      await tx.delete(categories);
    });
  }
  async getTelegramBotConfig() {
    const [config] = await db.select().from(telegramBotConfigs).limit(1);
    return config || void 0;
  }
  async createOrUpdateTelegramBotConfig(insertConfig) {
    const existing = await this.getTelegramBotConfig();
    if (existing) {
      const [updated] = await db.update(telegramBotConfigs).set({
        ...insertConfig,
        updatedAt: sql2`NOW()`
      }).where(eq(telegramBotConfigs.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(telegramBotConfigs).values(insertConfig).returning();
      return created;
    }
  }
  async deleteTelegramBotConfig() {
    const existing = await this.getTelegramBotConfig();
    if (!existing) return false;
    const result = await db.delete(telegramBotConfigs).where(eq(telegramBotConfigs.id, existing.id));
    return (result.rowCount || 0) > 0;
  }
  async getUserState(chatId) {
    const [state] = await db.select().from(telegramUserStates).where(eq(telegramUserStates.chatId, chatId));
    return state || void 0;
  }
  async setUserState(chatId, state, data) {
    const existing = await this.getUserState(chatId);
    const stateData = {
      chatId,
      state,
      data: data ? JSON.stringify(data) : null,
      updatedAt: sql2`NOW()`
    };
    if (existing) {
      await db.update(telegramUserStates).set(stateData).where(eq(telegramUserStates.chatId, chatId));
    } else {
      await db.insert(telegramUserStates).values(stateData);
    }
  }
  async clearUserState(chatId) {
    await db.delete(telegramUserStates).where(eq(telegramUserStates.chatId, chatId));
  }
  async getGeminiConfig() {
    const [config] = await db.select().from(geminiConfigs).limit(1);
    return config || void 0;
  }
  async createOrUpdateGeminiConfig(insertConfig) {
    const existing = await this.getGeminiConfig();
    if (existing) {
      const [updated] = await db.update(geminiConfigs).set({
        ...insertConfig,
        updatedAt: sql2`NOW()`
      }).where(eq(geminiConfigs.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(geminiConfigs).values(insertConfig).returning();
      return created;
    }
  }
  async deleteGeminiConfig() {
    const existing = await this.getGeminiConfig();
    if (!existing) return false;
    const result = await db.delete(geminiConfigs).where(eq(geminiConfigs.id, existing.id));
    return (result.rowCount || 0) > 0;
  }
  async getOpenAIConfig() {
    const [config] = await db.select().from(openaiConfigs).limit(1);
    return config || void 0;
  }
  async createOrUpdateOpenAIConfig(insertConfig) {
    const existing = await this.getOpenAIConfig();
    if (existing) {
      const [updated] = await db.update(openaiConfigs).set({
        ...insertConfig,
        updatedAt: sql2`NOW()`
      }).where(eq(openaiConfigs.id, existing.id)).returning();
      return updated;
    } else {
      const [created] = await db.insert(openaiConfigs).values(insertConfig).returning();
      return created;
    }
  }
  async deleteOpenAIConfig() {
    const existing = await this.getOpenAIConfig();
    if (!existing) return false;
    const result = await db.delete(openaiConfigs).where(eq(openaiConfigs.id, existing.id));
    return (result.rowCount || 0) > 0;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
init_telegram_bot();
import { z as z2 } from "zod";

// server/telegram-bot-handlers.ts
init_telegram_bot();

// server/telegram-bot-menus.ts
init_telegram_bot();
function createMainMenu2() {
  return createInlineKeyboard([
    [
      { text: "\u{1F4CA} Dashboard", callback_data: "menu_dashboard" },
      { text: "\u2795 Add Expense", callback_data: "menu_add_expense" }
    ],
    [
      { text: "\u{1F4B0} Manage Funds", callback_data: "menu_funds" },
      { text: "\u{1F4B3} Payments", callback_data: "menu_payments_main" }
    ],
    [
      { text: "\u{1F3F7}\uFE0F Categories", callback_data: "menu_categories" },
      { text: "\u{1F4C8} Analytics", callback_data: "menu_analytics" }
    ],
    [
      { text: "\u{1F4BE} Backup/Export", callback_data: "menu_backup" },
      { text: "\u{1F514} Reminders", callback_data: "menu_reminders" }
    ]
  ]);
}
function createFundsMenu() {
  return createInlineKeyboard([
    [
      { text: "\u2795 Add to Category", callback_data: "fund_add_category" },
      { text: "\u{1F4B5} Add to Cash", callback_data: "fund_add_cash" }
    ],
    [
      { text: "\u{1F3E6} Add to Debit Card", callback_data: "fund_add_debit" },
      { text: "\u{1F504} Reset Category", callback_data: "fund_reset_category" }
    ],
    [
      { text: "\u{1F3E0} Main Menu", callback_data: "menu_main" }
    ]
  ]);
}
function createPaymentsMenu() {
  return createInlineKeyboard([
    [
      { text: "\u{1F4B3} Pay Credit Card", callback_data: "payment_credit_card" },
      { text: "\u{1F4CB} View Methods", callback_data: "menu_payment_methods" }
    ],
    [
      { text: "\u{1F3E0} Main Menu", callback_data: "menu_main" }
    ]
  ]);
}
function createBackupMenu() {
  return createInlineKeyboard([
    [
      { text: "\u{1F4BE} Backup (JSON)", callback_data: "backup_json" },
      { text: "\u{1F4CA} Export Excel", callback_data: "backup_excel" }
    ],
    [
      { text: "\u{1F3E0} Main Menu", callback_data: "menu_main" }
    ]
  ]);
}
function createCancelMenu() {
  return createInlineKeyboard([
    [
      { text: "\u274C Cancel", callback_data: "cancel" }
    ]
  ]);
}
function createSelectionKeyboard(items, callbackPrefix, maxPerRow = 2) {
  const rows = [];
  for (let i = 0; i < items.length; i += maxPerRow) {
    const row = items.slice(i, i + maxPerRow).map((item) => ({
      text: item.name,
      callback_data: `${callbackPrefix}:${item.id}`
    }));
    rows.push(row);
  }
  rows.push([{ text: "\u274C Cancel", callback_data: "cancel" }]);
  return createInlineKeyboard(rows);
}

// server/telegram-bot-handlers.ts
import ExcelJS from "exceljs";
function getEmojiForIcon(iconName) {
  const iconMap = {
    "Building2": "\u{1F3E2}",
    "Building": "\u{1F3E2}",
    "ShoppingCart": "\u{1F6D2}",
    "ShoppingBag": "\u{1F6CD}\uFE0F",
    "Utensils": "\u{1F37D}\uFE0F",
    "Coffee": "\u2615",
    "Car": "\u{1F697}",
    "Bus": "\u{1F68C}",
    "Plane": "\u2708\uFE0F",
    "Home": "\u{1F3E0}",
    "Heart": "\u2764\uFE0F",
    "Zap": "\u26A1",
    "Gamepad2": "\u{1F3AE}",
    "Film": "\u{1F3AC}",
    "Music": "\u{1F3B5}",
    "Book": "\u{1F4DA}",
    "GraduationCap": "\u{1F393}",
    "Briefcase": "\u{1F4BC}",
    "DollarSign": "\u{1F4B5}",
    "CreditCard": "\u{1F4B3}",
    "Wallet": "\u{1F45B}",
    "Gift": "\u{1F381}",
    "Tag": "\u{1F3F7}\uFE0F",
    "Package": "\u{1F4E6}",
    "Truck": "\u{1F69A}",
    "Phone": "\u{1F4F1}",
    "Laptop": "\u{1F4BB}",
    "Monitor": "\u{1F5A5}\uFE0F",
    "Watch": "\u231A",
    "Activity": "\u{1F4CA}",
    "TrendingUp": "\u{1F4C8}",
    "Wrench": "\u{1F527}",
    "Hammer": "\u{1F528}",
    "Pill": "\u{1F48A}",
    "Stethoscope": "\u{1FA7A}",
    "Dumbbell": "\u{1F3CB}\uFE0F",
    "Pizza": "\u{1F355}",
    "Beer": "\u{1F37A}",
    "Wine": "\u{1F377}",
    "Shirt": "\u{1F455}",
    "Scissors": "\u2702\uFE0F",
    "Sparkles": "\u2728"
  };
  return iconMap[iconName || ""] || "\u{1F4C1}";
}
async function handleCallbackQuery(callbackQueryId, chatId, callbackData, storage2) {
  await answerCallbackQuery(callbackQueryId);
  if (callbackData === "confirm_ai_action") {
    const userState = await storage2.getUserState(chatId);
    if (userState?.state === "awaiting_confirmation") {
      const pendingAction = JSON.parse(userState.data || "{}");
      try {
        if (pendingAction.action === "add_expense_from_receipt" || pendingAction.action === "add_expense_from_voice") {
          const categories2 = await storage2.getAllCategories();
          if (categories2.length === 0) {
            await sendTelegramMessage(
              chatId,
              "\u274C No categories found. Please create a category first using the web app.",
              createMainMenu2()
            );
            await storage2.clearUserState(chatId);
            return;
          }
          const stateKey = pendingAction.action === "add_expense_from_voice" ? "awaiting_voice_category_first" : "awaiting_receipt_category_first";
          await storage2.setUserState(chatId, stateKey, pendingAction);
          const { createInlineKeyboard: createInlineKeyboard2 } = await Promise.resolve().then(() => (init_telegram_bot(), telegram_bot_exports));
          const categoryButtons = categories2.slice(0, 12).map((cat) => ({
            text: `${getEmojiForIcon(cat.icon)} ${cat.name}`,
            callback_data: pendingAction.action === "add_expense_from_voice" ? `voice_cat_first:${cat.id}` : `receipt_cat_first:${cat.id}`
          }));
          const buttonRows = [];
          for (let i = 0; i < categoryButtons.length; i += 2) {
            buttonRows.push(categoryButtons.slice(i, i + 2));
          }
          buttonRows.push([{ text: "\u274C Cancel", callback_data: "cancel_ai_action" }]);
          const keyboard = createInlineKeyboard2(buttonRows);
          await sendTelegramMessage(
            chatId,
            `\u{1F4C1} *Select Category*

Choose a category for this expense:`,
            keyboard
          );
          return;
        }
        const { executePendingAction: executePendingAction2 } = await Promise.resolve().then(() => (init_telegram_ai(), telegram_ai_exports));
        await executePendingAction2(chatId, pendingAction, storage2);
        await storage2.clearUserState(chatId);
      } catch (error) {
        console.error("[Telegram AI] Error executing pending action:", error);
        await sendTelegramMessage(
          chatId,
          "\u274C An error occurred while processing your request. Please try again.",
          createMainMenu2()
        );
        await storage2.clearUserState(chatId);
      }
    }
    return;
  }
  if (callbackData === "cancel_ai_action") {
    const userState = await storage2.getUserState(chatId);
    if (userState?.state === "awaiting_confirmation" || userState?.state === "awaiting_receipt_category" || userState?.state === "awaiting_receipt_payment" || userState?.state === "awaiting_receipt_category_first" || userState?.state === "awaiting_voice_category_first" || userState?.state === "awaiting_voice_payment") {
      await storage2.clearUserState(chatId);
      await sendTelegramMessage(
        chatId,
        "\u2705 Action cancelled. What else can I help you with?",
        createMainMenu2()
      );
    }
    return;
  }
  if (callbackData === "menu_main") {
    await sendTelegramMessage(
      chatId,
      "\u{1F3E0} *Main Menu*\n\nSelect an option:",
      createMainMenu2()
    );
    await storage2.clearUserState(chatId);
    return;
  }
  if (callbackData === "cancel") {
    await sendTelegramMessage(
      chatId,
      "\u274C Operation cancelled.",
      createMainMenu2()
    );
    await storage2.clearUserState(chatId);
    return;
  }
  if (callbackData === "menu_dashboard") {
    await handleDashboard(chatId, storage2);
    return;
  }
  if (callbackData === "menu_add_expense") {
    const categories2 = await storage2.getAllCategories();
    if (categories2.length === 0) {
      await sendTelegramMessage(
        chatId,
        "\u274C No categories found. Please add categories in the web app first.",
        createMainMenu2()
      );
      return;
    }
    await sendTelegramMessage(
      chatId,
      "\u2795 *Add Expense*\n\n\u{1F4C2} Select a category:",
      createSelectionKeyboard(categories2, "select_expense_category")
    );
    await storage2.setUserState(chatId, "add_expense_select_category");
    return;
  }
  if (callbackData === "menu_funds") {
    await sendTelegramMessage(
      chatId,
      "\u{1F4B0} *Manage Funds*\n\nChoose an option:",
      createFundsMenu()
    );
    return;
  }
  if (callbackData === "fund_add_category") {
    const categories2 = await storage2.getAllCategories();
    if (categories2.length === 0) {
      await sendTelegramMessage(
        chatId,
        "\u274C No categories found.",
        createMainMenu2()
      );
      return;
    }
    await sendTelegramMessage(
      chatId,
      "\u{1F3F7}\uFE0F *Add Funds to Category*\n\nSelect a category:",
      createSelectionKeyboard(categories2, "select_category_fund")
    );
    await storage2.setUserState(chatId, "select_category_for_fund");
    return;
  }
  if (callbackData === "fund_add_cash") {
    const paymentMethods2 = await storage2.getAllPaymentMethods();
    const cashMethod = paymentMethods2.find((pm) => pm.type === "cash");
    if (!cashMethod) {
      await sendTelegramMessage(
        chatId,
        "\u274C No cash payment method found.",
        createMainMenu2()
      );
      return;
    }
    await sendTelegramMessage(
      chatId,
      "\u{1F4B5} *Add Funds to Cash*\n\nEnter the amount to add:",
      createCancelMenu()
    );
    await storage2.setUserState(chatId, "add_fund_cash_amount", { paymentMethodId: cashMethod.id });
    return;
  }
  if (callbackData === "fund_add_debit") {
    const paymentMethods2 = await storage2.getAllPaymentMethods();
    const debitCards = paymentMethods2.filter((pm) => pm.type === "debit_card");
    if (debitCards.length === 0) {
      await sendTelegramMessage(
        chatId,
        "\u274C No debit cards found.",
        createMainMenu2()
      );
      return;
    }
    await sendTelegramMessage(
      chatId,
      "\u{1F3E6} *Add Deposit to Debit Card*\n\nSelect a debit card:",
      createSelectionKeyboard(debitCards, "select_debit_fund")
    );
    await storage2.setUserState(chatId, "select_debit_for_fund");
    return;
  }
  if (callbackData === "fund_reset_category") {
    const categories2 = await storage2.getAllCategories();
    if (categories2.length === 0) {
      await sendTelegramMessage(
        chatId,
        "\u274C No categories found.",
        createMainMenu2()
      );
      return;
    }
    await sendTelegramMessage(
      chatId,
      "\u{1F504} *Reset Category*\n\nSelect a category to reset:",
      createSelectionKeyboard(categories2, "confirm_reset_category")
    );
    await storage2.setUserState(chatId, "select_category_to_reset");
    return;
  }
  if (callbackData === "menu_payments_main") {
    await sendTelegramMessage(
      chatId,
      "\u{1F4B3} *Payments*\n\nChoose an option:",
      createPaymentsMenu()
    );
    return;
  }
  if (callbackData === "payment_credit_card") {
    const paymentMethods2 = await storage2.getAllPaymentMethods();
    const creditCards = paymentMethods2.filter((pm) => pm.type === "credit_card");
    if (creditCards.length === 0) {
      await sendTelegramMessage(
        chatId,
        "\u274C No credit cards found.",
        createMainMenu2()
      );
      return;
    }
    await sendTelegramMessage(
      chatId,
      "\u{1F4B3} *Pay Credit Card*\n\nSelect a credit card:",
      createSelectionKeyboard(creditCards, "select_credit_payment")
    );
    await storage2.setUserState(chatId, "select_credit_for_payment");
    return;
  }
  if (callbackData === "menu_payment_methods") {
    await handlePaymentMethods(chatId, storage2);
    return;
  }
  if (callbackData === "menu_categories") {
    await handleCategories(chatId, storage2);
    return;
  }
  if (callbackData === "menu_analytics") {
    await handleAnalytics(chatId, storage2);
    return;
  }
  if (callbackData === "menu_backup") {
    await sendTelegramMessage(
      chatId,
      "\u{1F4BE} *Backup & Export*\n\nChoose an option:",
      createBackupMenu()
    );
    return;
  }
  if (callbackData === "backup_json") {
    await handleJsonBackup(chatId, storage2);
    return;
  }
  if (callbackData === "backup_excel") {
    await handleExcelExport(chatId, storage2);
    return;
  }
  if (callbackData === "menu_reminders") {
    await handleReminders(chatId, storage2);
    return;
  }
  await handleSelectionCallback(chatId, callbackData, storage2);
}
async function handleDashboard(chatId, storage2) {
  const allExpenses = await storage2.getAllExpenses();
  const allCategories = await storage2.getAllCategories();
  const allPaymentMethods = await storage2.getAllPaymentMethods();
  const totalSpent = allExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const totalExpenses = allExpenses.length;
  const totalCategories = allCategories.length;
  const totalPaymentMethods = allPaymentMethods.length;
  const paymentMethodMap = new Map(allPaymentMethods.map((pm) => [pm.id, pm.name]));
  const recentExpenses = allExpenses.slice(0, 5);
  let recentList = "";
  if (recentExpenses.length > 0) {
    recentList = recentExpenses.map((e) => {
      const paymentMethodName = paymentMethodMap.get(e.paymentMethod) || e.paymentMethod;
      return `\u2022 AED ${parseFloat(e.amount).toFixed(2)} - ${e.description}
  ${e.category} via ${paymentMethodName}`;
    }).join("\n\n");
  } else {
    recentList = "No expenses yet";
  }
  await sendTelegramMessage(
    chatId,
    `\u{1F4CA} *Dashboard Summary*

\u{1F4B0} Total Spent: AED ${totalSpent.toFixed(2)}
\u{1F4DD} Total Expenses: ${totalExpenses}
\u{1F3F7}\uFE0F Categories: ${totalCategories}
\u{1F4B3} Payment Methods: ${totalPaymentMethods}

\u{1F550} *Recent Expenses:*

${recentList}`,
    createMainMenu2()
  );
}
async function handleCategories(chatId, storage2) {
  const allCategories = await storage2.getAllCategories();
  const allExpenses = await storage2.getAllExpenses();
  let categoriesText = "\u{1F3F7}\uFE0F *Categories*\n\n";
  if (allCategories.length > 0) {
    allCategories.forEach((category) => {
      const categoryExpenses = allExpenses.filter((e) => e.category.trim() === category.name.trim());
      const total = categoryExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const allocatedFunds = category.allocatedFunds ? parseFloat(category.allocatedFunds) : 0;
      categoriesText += `${getEmojiForIcon(category.icon)} *${category.name}*
`;
      if (allocatedFunds > 0) {
        categoriesText += `  Budget: AED ${allocatedFunds.toFixed(2)}
`;
      }
      categoriesText += `  Spent: AED ${total.toFixed(2)} (${categoryExpenses.length} expenses)

`;
    });
  } else {
    categoriesText += "No categories found.";
  }
  await sendTelegramMessage(chatId, categoriesText, createMainMenu2());
}
async function handlePaymentMethods(chatId, storage2) {
  const allPaymentMethods = await storage2.getAllPaymentMethods();
  let paymentsText = "\u{1F4B3} *Payment Methods*\n\n";
  if (allPaymentMethods.length > 0) {
    allPaymentMethods.forEach((method) => {
      const balance = method.balance ? parseFloat(method.balance) : 0;
      const typeIcon = method.type === "credit_card" ? "\u{1F4B3}" : method.type === "debit_card" ? "\u{1F3E6}" : method.type === "bank_account" ? "\u{1F3DB}\uFE0F" : "\u{1F4B5}";
      paymentsText += `${typeIcon} *${method.name}*
`;
      paymentsText += `  Type: ${method.type.replace("_", " ")}
`;
      paymentsText += `  Balance: AED ${balance.toFixed(2)}
`;
      if (method.type === "credit_card" && method.creditLimit) {
        const creditLimit = parseFloat(method.creditLimit);
        const utilization = (balance / creditLimit * 100).toFixed(1);
        paymentsText += `  Credit Limit: AED ${creditLimit.toFixed(2)}
`;
        paymentsText += `  Utilization: ${utilization}%
`;
      }
      if (method.dueDate) {
        paymentsText += `  Due Date: Day ${method.dueDate} of month
`;
      }
      paymentsText += "\n";
    });
  } else {
    paymentsText += "No payment methods found.";
  }
  await sendTelegramMessage(chatId, paymentsText, createPaymentsMenu());
}
async function handleAnalytics(chatId, storage2) {
  const allExpenses = await storage2.getAllExpenses();
  const allCategories = await storage2.getAllCategories();
  const categoryStats = allCategories.map((category) => {
    const categoryExpenses = allExpenses.filter((e) => e.category.trim() === category.name.trim());
    const total = categoryExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    return { name: category.name, total, count: categoryExpenses.length };
  }).filter((stat) => stat.count > 0).sort((a, b) => b.total - a.total);
  const totalSpent = allExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  let analyticsText = "\u{1F4C8} *Spending Analytics*\n\n";
  if (categoryStats.length > 0) {
    categoryStats.forEach((stat) => {
      const percentage = totalSpent > 0 ? (stat.total / totalSpent * 100).toFixed(1) : "0";
      analyticsText += `${stat.name}
`;
      analyticsText += `  AED ${stat.total.toFixed(2)} (${percentage}%) - ${stat.count} expenses

`;
    });
  } else {
    analyticsText += "No expenses to analyze yet.";
  }
  await sendTelegramMessage(chatId, analyticsText, createMainMenu2());
}
async function handleJsonBackup(chatId, storage2) {
  const allExpenses = await storage2.getAllExpenses();
  const allCategories = await storage2.getAllCategories();
  const allPaymentMethods = await storage2.getAllPaymentMethods();
  const allFundHistory = await storage2.getAllFundHistory();
  const backupData = {
    expenses: allExpenses,
    categories: allCategories,
    paymentMethods: allPaymentMethods,
    fundHistory: allFundHistory,
    exportDate: (/* @__PURE__ */ new Date()).toISOString()
  };
  const backupText = JSON.stringify(backupData, null, 2);
  const fileName = `expense-tracker-backup-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
  await sendTelegramDocument(
    chatId,
    fileName,
    backupText,
    `\u{1F4BE} *Backup Complete*

Expenses: ${allExpenses.length}
Categories: ${allCategories.length}
Payment Methods: ${allPaymentMethods.length}`,
    createMainMenu2()
  );
}
async function handleExcelExport(chatId, storage2) {
  const allExpenses = await storage2.getAllExpenses();
  const allCategories = await storage2.getAllCategories();
  const allPaymentMethods = await storage2.getAllPaymentMethods();
  const workbook = new ExcelJS.Workbook();
  const expensesSheet = workbook.addWorksheet("Expenses");
  expensesSheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "Amount (AED)", key: "amount", width: 15 },
    { header: "Description", key: "description", width: 30 },
    { header: "Category", key: "category", width: 20 },
    { header: "Payment Method", key: "paymentMethod", width: 20 }
  ];
  const paymentMethodMap = new Map(allPaymentMethods.map((pm) => [pm.id, pm.name]));
  allExpenses.forEach((expense) => {
    const expDate = new Date(expense.date);
    const formattedDate = `${expDate.getDate().toString().padStart(2, "0")}/${(expDate.getMonth() + 1).toString().padStart(2, "0")}/${expDate.getFullYear()}`;
    expensesSheet.addRow({
      date: formattedDate,
      amount: parseFloat(expense.amount),
      description: expense.description,
      category: expense.category,
      paymentMethod: paymentMethodMap.get(expense.paymentMethod) || expense.paymentMethod
    });
  });
  const categoriesSheet = workbook.addWorksheet("Categories");
  categoriesSheet.columns = [
    { header: "Name", key: "name", width: 20 },
    { header: "Allocated Funds (AED)", key: "allocatedFunds", width: 20 },
    { header: "Icon", key: "icon", width: 10 }
  ];
  allCategories.forEach((category) => {
    categoriesSheet.addRow({
      name: category.name,
      allocatedFunds: category.allocatedFunds ? parseFloat(category.allocatedFunds) : 0,
      icon: category.icon
    });
  });
  const paymentMethodsSheet = workbook.addWorksheet("Payment Methods");
  paymentMethodsSheet.columns = [
    { header: "Name", key: "name", width: 20 },
    { header: "Type", key: "type", width: 15 },
    { header: "Balance (AED)", key: "balance", width: 15 },
    { header: "Credit Limit (AED)", key: "creditLimit", width: 20 },
    { header: "Due Date", key: "dueDate", width: 15 }
  ];
  allPaymentMethods.forEach((method) => {
    paymentMethodsSheet.addRow({
      name: method.name,
      type: method.type,
      balance: method.balance ? parseFloat(method.balance) : 0,
      creditLimit: method.creditLimit ? parseFloat(method.creditLimit) : "",
      dueDate: method.dueDate ? `Day ${method.dueDate}` : ""
    });
  });
  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `expense-tracker-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.xlsx`;
  await sendTelegramDocument(
    chatId,
    fileName,
    Buffer.from(buffer),
    `\u{1F4CA} *Excel Export Complete*

Expenses: ${allExpenses.length}
Categories: ${allCategories.length}
Payment Methods: ${allPaymentMethods.length}`,
    createMainMenu2()
  );
}
async function handleReminders(chatId, storage2) {
  const allPaymentMethods = await storage2.getAllPaymentMethods();
  const creditCards = allPaymentMethods.filter((pm) => pm.type === "credit_card" && pm.dueDate);
  let remindersText = "\u{1F514} *Payment Reminders*\n\n";
  if (creditCards.length === 0) {
    remindersText += "No credit card payment reminders set.";
  } else {
    const today = /* @__PURE__ */ new Date();
    const currentDay = today.getDate();
    creditCards.forEach((card) => {
      const balance = card.balance ? parseFloat(card.balance) : 0;
      const dueDate = card.dueDate;
      let daysUntilDue = dueDate - currentDay;
      if (daysUntilDue < 0) {
        daysUntilDue += 30;
      }
      const urgency = daysUntilDue <= 3 ? "\u{1F534}" : daysUntilDue <= 7 ? "\u{1F7E1}" : "\u{1F7E2}";
      remindersText += `${urgency} *${card.name}*
`;
      remindersText += `  Balance: AED ${balance.toFixed(2)}
`;
      remindersText += `  Due Date: Day ${dueDate}
`;
      remindersText += `  Days Until Due: ${daysUntilDue}

`;
    });
  }
  await sendTelegramMessage(chatId, remindersText, createMainMenu2());
}
async function handleSelectionCallback(chatId, callbackData, storage2) {
  const [action, id] = callbackData.split(":");
  if (action === "select_category_fund") {
    await sendTelegramMessage(
      chatId,
      "\u{1F4B0} *Add Funds to Category*\n\nEnter the amount to add:",
      createCancelMenu()
    );
    await storage2.setUserState(chatId, "add_fund_category_amount", { categoryId: id });
    return;
  }
  if (action === "select_debit_fund") {
    await sendTelegramMessage(
      chatId,
      "\u{1F3E6} *Add Deposit*\n\nEnter the amount to deposit:",
      createCancelMenu()
    );
    await storage2.setUserState(chatId, "add_fund_debit_amount", { paymentMethodId: id });
    return;
  }
  if (action === "confirm_reset_category") {
    const result = await storage2.resetCategory(id);
    await sendTelegramMessage(
      chatId,
      `\u2705 *Category Reset Successfully!*

Deleted ${result.deletedExpenses} expenses
Deleted ${result.deletedFundHistory} fund history records
Category funds reset to AED 0.00`,
      createMainMenu2()
    );
    await storage2.clearUserState(chatId);
    return;
  }
  if (action === "select_credit_payment") {
    await sendTelegramMessage(
      chatId,
      "\u{1F4B3} *Pay Credit Card*\n\nEnter the payment amount:",
      createCancelMenu()
    );
    await storage2.setUserState(chatId, "pay_credit_amount", { paymentMethodId: id });
    return;
  }
  if (action === "select_expense_category") {
    const category = await storage2.getCategory(id);
    if (!category) {
      await sendTelegramMessage(chatId, "\u274C Category not found.", createMainMenu2());
      return;
    }
    const paymentMethods2 = await storage2.getAllPaymentMethods();
    if (paymentMethods2.length === 0) {
      await sendTelegramMessage(
        chatId,
        "\u274C No payment methods found. Please add payment methods in the web app first.",
        createMainMenu2()
      );
      return;
    }
    await sendTelegramMessage(
      chatId,
      "\u2795 *Add Expense*\n\n\u{1F4B3} Select payment method:",
      createSelectionKeyboard(paymentMethods2, "select_expense_payment")
    );
    await storage2.setUserState(chatId, "add_expense_select_payment", {
      categoryId: id,
      categoryName: category.name
    });
    return;
  }
  if (action === "select_expense_payment") {
    const userState = await storage2.getUserState(chatId);
    if (!userState || !userState.data) {
      await sendTelegramMessage(chatId, "\u274C Session expired. Please start again.", createMainMenu2());
      return;
    }
    const data = JSON.parse(userState.data);
    const paymentMethod = await storage2.getPaymentMethod(id);
    await sendTelegramMessage(
      chatId,
      "\u2795 *Add Expense*\n\n\u{1F4B5} Enter the amount (numbers only):",
      createCancelMenu()
    );
    await storage2.setUserState(chatId, "add_expense_amount", {
      ...data,
      paymentMethodId: id,
      paymentMethodName: paymentMethod?.name || "Unknown"
    });
    return;
  }
  if (action === "receipt_cat_first") {
    const userState = await storage2.getUserState(chatId);
    if (!userState || userState.state !== "awaiting_receipt_category_first") {
      await sendTelegramMessage(chatId, "\u274C Session expired. Please start again.", createMainMenu2());
      return;
    }
    const receiptData = JSON.parse(userState.data || "{}");
    const category = await storage2.getCategory(id);
    if (!category) {
      await sendTelegramMessage(chatId, "\u274C Category not found.", createMainMenu2());
      await storage2.clearUserState(chatId);
      return;
    }
    const paymentMethods2 = await storage2.getAllPaymentMethods();
    if (paymentMethods2.length === 0) {
      await sendTelegramMessage(
        chatId,
        "\u274C No payment methods found. Please create payment methods first using the web app.",
        createMainMenu2()
      );
      await storage2.clearUserState(chatId);
      return;
    }
    await storage2.setUserState(chatId, "awaiting_receipt_payment", {
      ...receiptData,
      category: category.name,
      categoryId: category.id
    });
    const { createInlineKeyboard: createInlineKeyboard2 } = await Promise.resolve().then(() => (init_telegram_bot(), telegram_bot_exports));
    const paymentButtons = paymentMethods2.map((pm) => ({
      text: pm.name,
      callback_data: `receipt_payment:${pm.id}`
    }));
    const buttonRows = [];
    for (let i = 0; i < paymentButtons.length; i += 2) {
      buttonRows.push(paymentButtons.slice(i, i + 2));
    }
    buttonRows.push([{ text: "\u274C Cancel", callback_data: "cancel_ai_action" }]);
    const keyboard = createInlineKeyboard2(buttonRows);
    await sendTelegramMessage(
      chatId,
      `\u{1F4B3} *Select Payment Method*

Choose a payment method for this expense:`,
      keyboard
    );
    return;
  }
  if (action === "voice_cat_first") {
    const userState = await storage2.getUserState(chatId);
    if (!userState || userState.state !== "awaiting_voice_category_first") {
      await sendTelegramMessage(chatId, "\u274C Session expired. Please start again.", createMainMenu2());
      return;
    }
    const voiceData = JSON.parse(userState.data || "{}");
    const category = await storage2.getCategory(id);
    if (!category) {
      await sendTelegramMessage(chatId, "\u274C Category not found.", createMainMenu2());
      await storage2.clearUserState(chatId);
      return;
    }
    const paymentMethods2 = await storage2.getAllPaymentMethods();
    if (paymentMethods2.length === 0) {
      await sendTelegramMessage(
        chatId,
        "\u274C No payment methods found. Please create payment methods first using the web app.",
        createMainMenu2()
      );
      await storage2.clearUserState(chatId);
      return;
    }
    await storage2.setUserState(chatId, "awaiting_voice_payment", {
      ...voiceData,
      category: category.name,
      categoryId: category.id
    });
    const { createInlineKeyboard: createInlineKeyboard2 } = await Promise.resolve().then(() => (init_telegram_bot(), telegram_bot_exports));
    const paymentButtons = paymentMethods2.map((pm) => ({
      text: pm.name,
      callback_data: `voice_payment:${pm.id}`
    }));
    const buttonRows = [];
    for (let i = 0; i < paymentButtons.length; i += 2) {
      buttonRows.push(paymentButtons.slice(i, i + 2));
    }
    buttonRows.push([{ text: "\u274C Cancel", callback_data: "cancel_ai_action" }]);
    const keyboard = createInlineKeyboard2(buttonRows);
    await sendTelegramMessage(
      chatId,
      `\u{1F4B3} *Select Payment Method*

Choose a payment method for this expense:`,
      keyboard
    );
    return;
  }
  if (action === "voice_payment") {
    const userState = await storage2.getUserState(chatId);
    if (!userState || userState.state !== "awaiting_voice_payment") {
      await sendTelegramMessage(chatId, "\u274C Session expired. Please start again.", createMainMenu2());
      return;
    }
    const voiceData = JSON.parse(userState.data || "{}");
    const paymentMethod = await storage2.getPaymentMethod(id);
    if (!paymentMethod) {
      await sendTelegramMessage(chatId, "\u274C Payment method not found.", createMainMenu2());
      await storage2.clearUserState(chatId);
      return;
    }
    const { executePendingAction: executePendingAction2 } = await Promise.resolve().then(() => (init_telegram_ai(), telegram_ai_exports));
    const expenseData = {
      ...voiceData,
      action: "add_expense",
      category: voiceData.category,
      paymentMethod: paymentMethod.name
    };
    try {
      await executePendingAction2(chatId, expenseData, storage2);
      await storage2.clearUserState(chatId);
    } catch (error) {
      console.error("[Telegram Bot] Error creating expense from voice:", error);
      await sendTelegramMessage(
        chatId,
        "\u274C Failed to create expense. Please try again.",
        createMainMenu2()
      );
      await storage2.clearUserState(chatId);
    }
    return;
  }
  if (action === "receipt_payment") {
    const userState = await storage2.getUserState(chatId);
    if (!userState || userState.state !== "awaiting_receipt_payment") {
      await sendTelegramMessage(chatId, "\u274C Session expired. Please start again.", createMainMenu2());
      return;
    }
    const receiptData = JSON.parse(userState.data || "{}");
    const paymentMethod = await storage2.getPaymentMethod(id);
    if (!paymentMethod) {
      await sendTelegramMessage(chatId, "\u274C Payment method not found.", createMainMenu2());
      await storage2.clearUserState(chatId);
      return;
    }
    const { executePendingAction: executePendingAction2 } = await Promise.resolve().then(() => (init_telegram_ai(), telegram_ai_exports));
    const expenseData = {
      ...receiptData,
      action: "add_expense",
      category: receiptData.category,
      paymentMethod: paymentMethod.name
    };
    try {
      await executePendingAction2(chatId, expenseData, storage2);
      await storage2.clearUserState(chatId);
    } catch (error) {
      console.error("[Telegram Bot] Error creating expense from receipt:", error);
      await sendTelegramMessage(
        chatId,
        "\u274C Failed to create expense. Please try again.",
        createMainMenu2()
      );
      await storage2.clearUserState(chatId);
    }
    return;
  }
}
async function handleTextMessage(chatId, text2, storage2) {
  const userState = await storage2.getUserState(chatId);
  if (!userState || !userState.state) {
    await sendTelegramMessage(
      chatId,
      "\u{1F44B} Welcome! Please use the menu buttons to navigate.",
      createMainMenu2()
    );
    return;
  }
  const state = userState.state;
  const data = userState.data ? JSON.parse(userState.data) : {};
  if (state === "add_expense_amount") {
    const amount = parseFloat(text2);
    if (isNaN(amount) || amount <= 0) {
      await sendTelegramMessage(
        chatId,
        "\u274C Invalid amount. Please enter a positive number:",
        createCancelMenu()
      );
      return;
    }
    await sendTelegramMessage(
      chatId,
      '\u2795 *Add Expense*\n\n\u{1F4DD} Enter a description/note (or type "skip" to skip):',
      createCancelMenu()
    );
    await storage2.setUserState(chatId, "add_expense_description", {
      ...data,
      amount: amount.toString()
    });
    return;
  }
  if (state === "add_expense_description") {
    const description = text2.trim().toLowerCase() === "skip" ? "No description" : text2.trim();
    const expense = await storage2.createExpense({
      amount: data.amount,
      description,
      category: data.categoryName,
      paymentMethod: data.paymentMethodId,
      date: /* @__PURE__ */ new Date()
    });
    await sendTelegramMessage(
      chatId,
      `\u2705 *Expense Added Successfully!*

Amount: AED ${parseFloat(expense.amount).toFixed(2)}
Description: ${expense.description}
Category: ${data.categoryName}
Payment: ${data.paymentMethodName}`,
      createMainMenu2()
    );
    await storage2.clearUserState(chatId);
    return;
  }
  if (state === "add_fund_category_amount") {
    const amount = parseFloat(text2);
    if (isNaN(amount) || amount <= 0) {
      await sendTelegramMessage(
        chatId,
        "\u274C Invalid amount. Please enter a positive number:",
        createCancelMenu()
      );
      return;
    }
    const result = await storage2.addFundsToCategory(data.categoryId, amount);
    const category = result.updatedCategory;
    await sendTelegramMessage(
      chatId,
      `\u2705 *Funds Added Successfully!*

Category: ${category.name}
Amount Added: AED ${amount.toFixed(2)}
New Balance: AED ${parseFloat(category.allocatedFunds || "0").toFixed(2)}`,
      createMainMenu2()
    );
    await storage2.clearUserState(chatId);
    return;
  }
  if (state === "add_fund_cash_amount" || state === "add_fund_debit_amount") {
    const amount = parseFloat(text2);
    if (isNaN(amount) || amount <= 0) {
      await sendTelegramMessage(
        chatId,
        "\u274C Invalid amount. Please enter a positive number:",
        createCancelMenu()
      );
      return;
    }
    const result = await storage2.addFundsToPaymentMethod(data.paymentMethodId, amount);
    const paymentMethod = result.updatedPaymentMethod;
    await sendTelegramMessage(
      chatId,
      `\u2705 *Funds Added Successfully!*

${paymentMethod.name}
Amount Added: AED ${amount.toFixed(2)}
New Balance: AED ${parseFloat(paymentMethod.balance || "0").toFixed(2)}`,
      createMainMenu2()
    );
    await storage2.clearUserState(chatId);
    return;
  }
  if (state === "pay_credit_amount") {
    const amount = parseFloat(text2);
    if (isNaN(amount) || amount <= 0) {
      await sendTelegramMessage(
        chatId,
        "\u274C Invalid amount. Please enter a positive number:",
        createCancelMenu()
      );
      return;
    }
    const result = await storage2.addFundsToPaymentMethod(data.paymentMethodId, -amount);
    const paymentMethod = result.updatedPaymentMethod;
    await sendTelegramMessage(
      chatId,
      `\u2705 *Payment Made Successfully!*

${paymentMethod.name}
Payment Amount: AED ${amount.toFixed(2)}
New Balance: AED ${parseFloat(paymentMethod.balance || "0").toFixed(2)}`,
      createMainMenu2()
    );
    await storage2.clearUserState(chatId);
    return;
  }
  await sendTelegramMessage(
    chatId,
    "\u274C Invalid input. Please use the menu buttons.",
    createCancelMenu()
  );
}

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/expenses", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const expenses2 = await storage.getAllExpenses(
        startDate ? new Date(startDate) : void 0,
        endDate ? new Date(endDate) : void 0
      );
      res.json(expenses2);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });
  app2.get("/api/expenses/:id", async (req, res) => {
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
  app2.post("/api/expenses", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validatedData);
      const { notifyTelegramExpenseCreated: notifyTelegramExpenseCreated2 } = await Promise.resolve().then(() => (init_telegram_notifications(), telegram_notifications_exports));
      notifyTelegramExpenseCreated2(expense, storage).catch((err) => {
        console.error("Failed to send Telegram notification:", err);
      });
      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error creating expense:", error);
      res.status(500).json({ error: "Failed to create expense" });
    }
  });
  app2.put("/api/expenses/:id", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.partial().parse(req.body);
      const expense = await storage.updateExpense(req.params.id, validatedData);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error updating expense:", error);
      res.status(500).json({ error: "Failed to update expense" });
    }
  });
  app2.delete("/api/expenses/:id", async (req, res) => {
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
  app2.post("/api/categories/seed", async (req, res) => {
    try {
      const { DEFAULT_CATEGORIES: DEFAULT_CATEGORIES2, CATEGORY_COLORS: CATEGORY_COLORS2 } = await Promise.resolve().then(() => (init_constants(), constants_exports));
      const seededCategories = [];
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
      for (const categoryName of DEFAULT_CATEGORIES2) {
        try {
          const existingCategories = await storage.getAllCategories();
          const exists = existingCategories.some((cat) => cat.name === categoryName);
          if (!exists) {
            const categoryData = {
              name: categoryName,
              color: CATEGORY_COLORS2[categoryName] || CATEGORY_COLORS2["Other"],
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
  app2.get("/api/categories", async (req, res) => {
    try {
      const categories2 = await storage.getAllCategories();
      res.json(categories2);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });
  app2.get("/api/categories/:id", async (req, res) => {
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
  app2.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      const { notifyTelegramCategoryCreated: notifyTelegramCategoryCreated2 } = await Promise.resolve().then(() => (init_telegram_notifications(), telegram_notifications_exports));
      notifyTelegramCategoryCreated2(category, storage).catch((err) => {
        console.error("Failed to send Telegram notification:", err);
      });
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });
  app2.put("/api/categories/:id", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedData);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });
  app2.delete("/api/categories/:id", async (req, res) => {
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
  app2.post("/api/categories/:id/reset", async (req, res) => {
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
  app2.get("/api/fund-history", async (req, res) => {
    try {
      const fundHistory2 = await storage.getAllFundHistory();
      res.json(fundHistory2);
    } catch (error) {
      console.error("Error fetching fund history:", error);
      res.status(500).json({ error: "Failed to fetch fund history" });
    }
  });
  app2.get("/api/categories/:categoryId/fund-history", async (req, res) => {
    try {
      const fundHistory2 = await storage.getFundHistoryByCategory(req.params.categoryId);
      res.json(fundHistory2);
    } catch (error) {
      console.error("Error fetching fund history for category:", error);
      res.status(500).json({ error: "Failed to fetch fund history for category" });
    }
  });
  app2.get("/api/fund-history/:id", async (req, res) => {
    try {
      const fundHistory2 = await storage.getFundHistory(req.params.id);
      if (!fundHistory2) {
        return res.status(404).json({ error: "Fund history not found" });
      }
      res.json(fundHistory2);
    } catch (error) {
      console.error("Error fetching fund history:", error);
      res.status(500).json({ error: "Failed to fetch fund history" });
    }
  });
  app2.post("/api/fund-history", async (req, res) => {
    try {
      const validatedData = insertFundHistorySchema.parse(req.body);
      const fundHistory2 = await storage.createFundHistory(validatedData);
      res.status(201).json(fundHistory2);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error creating fund history:", error);
      res.status(500).json({ error: "Failed to create fund history" });
    }
  });
  app2.post("/api/categories/:categoryId/add-funds", async (req, res) => {
    try {
      const { amount, description } = req.body;
      if (!amount || typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ error: "Amount must be a positive number" });
      }
      const result = await storage.addFundsToCategory(
        req.params.categoryId,
        amount,
        description
      );
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "Category not found") {
        return res.status(404).json({ error: "Category not found" });
      }
      console.error("Error adding funds to category:", error);
      res.status(500).json({ error: "Failed to add funds to category" });
    }
  });
  app2.put("/api/fund-history/:id", async (req, res) => {
    try {
      const validatedData = insertFundHistorySchema.partial().parse(req.body);
      const fundHistory2 = await storage.updateFundHistory(req.params.id, validatedData);
      if (!fundHistory2) {
        return res.status(404).json({ error: "Fund history not found" });
      }
      res.json(fundHistory2);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error updating fund history:", error);
      res.status(500).json({ error: "Failed to update fund history" });
    }
  });
  app2.delete("/api/fund-history/:id", async (req, res) => {
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
  app2.get("/api/payment-methods", async (req, res) => {
    try {
      const paymentMethods2 = await storage.getAllPaymentMethods();
      res.json(paymentMethods2);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ error: "Failed to fetch payment methods" });
    }
  });
  app2.get("/api/payment-methods/:id", async (req, res) => {
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
  app2.post("/api/payment-methods", async (req, res) => {
    try {
      const validatedData = insertPaymentMethodSchema.parse(req.body);
      const paymentMethod = await storage.createPaymentMethod(validatedData);
      const { notifyTelegramPaymentMethodCreated: notifyTelegramPaymentMethodCreated2 } = await Promise.resolve().then(() => (init_telegram_notifications(), telegram_notifications_exports));
      notifyTelegramPaymentMethodCreated2(paymentMethod, storage).catch((err) => {
        console.error("Failed to send Telegram notification:", err);
      });
      res.status(201).json(paymentMethod);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error creating payment method:", error);
      res.status(500).json({ error: "Failed to create payment method" });
    }
  });
  app2.put("/api/payment-methods/:id", async (req, res) => {
    try {
      const validatedData = insertPaymentMethodSchema.partial().parse(req.body);
      const paymentMethod = await storage.updatePaymentMethod(req.params.id, validatedData);
      if (!paymentMethod) {
        return res.status(404).json({ error: "Payment method not found" });
      }
      res.json(paymentMethod);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error updating payment method:", error);
      res.status(500).json({ error: "Failed to update payment method" });
    }
  });
  app2.delete("/api/payment-methods/:id", async (req, res) => {
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
  app2.post("/api/payment-methods/:id/add-funds", async (req, res) => {
    try {
      const { amount, description } = req.body;
      if (!amount || typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ error: "Amount must be a positive number" });
      }
      const result = await storage.addFundsToPaymentMethod(req.params.id, amount, description);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "Payment method not found") {
        return res.status(404).json({ error: "Payment method not found" });
      }
      console.error("Error adding funds to payment method:", error);
      res.status(500).json({ error: "Failed to add funds to payment method" });
    }
  });
  app2.get("/api/payment-method-fund-history", async (req, res) => {
    try {
      const fundHistory2 = await storage.getAllPaymentMethodFundHistory();
      res.json(fundHistory2);
    } catch (error) {
      console.error("Error fetching payment method fund history:", error);
      res.status(500).json({ error: "Failed to fetch payment method fund history" });
    }
  });
  app2.get("/api/payment-methods/:paymentMethodId/fund-history", async (req, res) => {
    try {
      const fundHistory2 = await storage.getPaymentMethodFundHistoryByPaymentMethod(req.params.paymentMethodId);
      res.json(fundHistory2);
    } catch (error) {
      console.error("Error fetching payment method fund history:", error);
      res.status(500).json({ error: "Failed to fetch payment method fund history" });
    }
  });
  app2.get("/api/payment-method-fund-history/:id", async (req, res) => {
    try {
      const fundHistory2 = await storage.getPaymentMethodFundHistory(req.params.id);
      if (!fundHistory2) {
        return res.status(404).json({ error: "Payment method fund history not found" });
      }
      res.json(fundHistory2);
    } catch (error) {
      console.error("Error fetching payment method fund history:", error);
      res.status(500).json({ error: "Failed to fetch payment method fund history" });
    }
  });
  app2.post("/api/payment-method-fund-history", async (req, res) => {
    try {
      const validatedData = insertPaymentMethodFundHistorySchema.parse(req.body);
      const fundHistory2 = await storage.createPaymentMethodFundHistory(validatedData);
      res.status(201).json(fundHistory2);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error creating payment method fund history:", error);
      res.status(500).json({ error: "Failed to create payment method fund history" });
    }
  });
  app2.put("/api/payment-method-fund-history/:id", async (req, res) => {
    try {
      const validatedData = insertPaymentMethodFundHistorySchema.partial().parse(req.body);
      const fundHistory2 = await storage.updatePaymentMethodFundHistory(req.params.id, validatedData);
      if (!fundHistory2) {
        return res.status(404).json({ error: "Payment method fund history not found" });
      }
      res.json(fundHistory2);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error updating payment method fund history:", error);
      res.status(500).json({ error: "Failed to update payment method fund history" });
    }
  });
  app2.delete("/api/payment-method-fund-history/:id", async (req, res) => {
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
  app2.get("/api/backup", async (req, res) => {
    try {
      const [expenses2, categories2, fundHistory2, paymentMethods2, paymentMethodFundHistory2] = await Promise.all([
        storage.getAllExpenses(),
        storage.getAllCategories(),
        storage.getAllFundHistory(),
        storage.getAllPaymentMethods(),
        storage.getAllPaymentMethodFundHistory()
      ]);
      const backup = {
        version: "1.0",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        data: {
          expenses: expenses2,
          categories: categories2,
          fundHistory: fundHistory2,
          paymentMethods: paymentMethods2,
          paymentMethodFundHistory: paymentMethodFundHistory2
        }
      };
      res.json(backup);
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({ error: "Failed to create backup" });
    }
  });
  app2.post("/api/restore", async (req, res) => {
    try {
      const backup = req.body;
      if (!backup.data || !backup.version) {
        return res.status(400).json({ error: "Invalid backup file format" });
      }
      const result = await db.transaction(async (tx) => {
        await tx.delete(expenses);
        await tx.delete(fundHistory);
        await tx.delete(paymentMethodFundHistory);
        await tx.delete(paymentMethods);
        await tx.delete(categories);
        const categoryIdMap = /* @__PURE__ */ new Map();
        if (backup.data.categories) {
          for (const category of backup.data.categories) {
            const [newCategory] = await tx.insert(categories).values({
              name: category.name,
              color: category.color,
              icon: category.icon,
              allocatedFunds: category.allocatedFunds || "0"
            }).returning();
            categoryIdMap.set(category.id, newCategory.id);
          }
        }
        const paymentMethodIdMap = /* @__PURE__ */ new Map();
        if (backup.data.paymentMethods) {
          for (const paymentMethod of backup.data.paymentMethods) {
            const [newPaymentMethod] = await tx.insert(paymentMethods).values({
              name: paymentMethod.name,
              type: paymentMethod.type,
              balance: paymentMethod.balance || "0",
              maxBalance: paymentMethod.maxBalance || "0",
              creditLimit: paymentMethod.creditLimit,
              dueDate: paymentMethod.dueDate,
              isActive: paymentMethod.isActive ?? true
            }).returning();
            paymentMethodIdMap.set(paymentMethod.id, newPaymentMethod.id);
          }
        }
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
  app2.get("/api/settings/telegram-bot", async (req, res) => {
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
  app2.put("/api/settings/telegram-bot", async (req, res) => {
    try {
      const validatedData = insertTelegramBotConfigSchema.parse(req.body);
      const config = await storage.createOrUpdateTelegramBotConfig(validatedData);
      await restartTelegramBot(storage);
      res.json(config);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error updating Telegram bot config:", error);
      res.status(500).json({ error: "Failed to update Telegram bot configuration" });
    }
  });
  app2.delete("/api/settings/telegram-bot", async (req, res) => {
    try {
      const success = await storage.deleteTelegramBotConfig();
      if (!success) {
        return res.status(404).json({ error: "Telegram bot configuration not found" });
      }
      await restartTelegramBot(storage);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting Telegram bot config:", error);
      res.status(500).json({ error: "Failed to delete Telegram bot configuration" });
    }
  });
  app2.get("/api/integrations/telegram/webhook-status", async (req, res) => {
    try {
      const config = await storage.getTelegramBotConfig();
      if (!config || !config.botToken) {
        return res.json({
          configured: false,
          message: "Bot token not configured"
        });
      }
      const response = await fetch(`https://api.telegram.org/bot${config.botToken}/getWebhookInfo`);
      const webhookInfo = await response.json();
      res.json({
        configured: true,
        isEnabled: config.isEnabled,
        webhookInfo
      });
    } catch (error) {
      console.error("Error checking webhook status:", error);
      res.status(500).json({ error: "Failed to check webhook status" });
    }
  });
  app2.post("/api/integrations/telegram/webhook", async (req, res) => {
    try {
      console.log("[Telegram Webhook] Received update:", JSON.stringify(req.body, null, 2));
      const config = await storage.getTelegramBotConfig();
      if (!config || !config.isEnabled) {
        console.log("[Telegram Webhook] Bot is not enabled");
        return res.status(403).json({ error: "Telegram bot is not enabled" });
      }
      const secretToken = req.headers["x-telegram-bot-api-secret-token"];
      if (config.webhookSecret && secretToken !== config.webhookSecret) {
        console.log("[Telegram Webhook] Invalid webhook secret");
        return res.status(403).json({ error: "Invalid webhook secret" });
      }
      const update = req.body;
      if (update.callback_query) {
        const callbackQuery = update.callback_query;
        const chatId = callbackQuery.message.chat.id.toString();
        const callbackData = callbackQuery.data;
        const chatWhitelist = config.chatWhitelist || [];
        if (chatWhitelist.length > 0 && !chatWhitelist.includes(chatId)) {
          await sendTelegramMessage(chatId, "\u274C Chat not authorized");
          return res.status(200).send("OK");
        }
        await handleCallbackQuery(callbackQuery.id, chatId, callbackData, storage);
        return res.status(200).send("OK");
      }
      if (update.message && update.message.voice) {
        const chatId = update.message.chat.id.toString();
        const chatWhitelist = config.chatWhitelist || [];
        if (chatWhitelist.length > 0 && !chatWhitelist.includes(chatId)) {
          return res.status(403).json({ error: "Chat not authorized" });
        }
        try {
          const voice = update.message.voice;
          const fileId = voice.file_id;
          const fileResponse = await fetch(`https://api.telegram.org/bot${config.botToken}/getFile?file_id=${fileId}`);
          const fileData = await fileResponse.json();
          if (fileData.ok && fileData.result.file_path) {
            const voiceUrl = `https://api.telegram.org/file/bot${config.botToken}/${fileData.result.file_path}`;
            const voiceResponse = await fetch(voiceUrl);
            const voiceBuffer = Buffer.from(await voiceResponse.arrayBuffer());
            const { processVoiceMessage: processVoiceMessage2 } = await Promise.resolve().then(() => (init_telegram_ai(), telegram_ai_exports));
            await processVoiceMessage2(chatId, voiceBuffer, storage);
          } else {
            await sendTelegramMessage(chatId, "\u274C Failed to download voice message. Please try again.");
          }
        } catch (error) {
          console.error("[Telegram Webhook] Error processing voice:", error);
          await sendTelegramMessage(chatId, "\u274C Failed to process voice message. Please try again.");
        }
        return res.status(200).send("OK");
      }
      if (update.message && update.message.photo) {
        const chatId = update.message.chat.id.toString();
        const chatWhitelist = config.chatWhitelist || [];
        if (chatWhitelist.length > 0 && !chatWhitelist.includes(chatId)) {
          return res.status(403).json({ error: "Chat not authorized" });
        }
        try {
          const photo = update.message.photo[update.message.photo.length - 1];
          const fileId = photo.file_id;
          const fileResponse = await fetch(`https://api.telegram.org/bot${config.botToken}/getFile?file_id=${fileId}`);
          const fileData = await fileResponse.json();
          if (fileData.ok && fileData.result.file_path) {
            const imageUrl = `https://api.telegram.org/file/bot${config.botToken}/${fileData.result.file_path}`;
            const imageResponse = await fetch(imageUrl);
            const imageBuffer = await imageResponse.arrayBuffer();
            const base64Image = Buffer.from(imageBuffer).toString("base64");
            const { processReceiptPhoto: processReceiptPhoto2 } = await Promise.resolve().then(() => (init_telegram_ai(), telegram_ai_exports));
            await processReceiptPhoto2(chatId, base64Image, storage);
          } else {
            await sendTelegramMessage(chatId, "\u274C Failed to download image. Please try again.");
          }
        } catch (error) {
          console.error("[Telegram Webhook] Error processing photo:", error);
          await sendTelegramMessage(chatId, "\u274C Failed to process receipt image. Please try again.");
        }
        return res.status(200).send("OK");
      }
      if (update.message && update.message.text) {
        const chatId = update.message.chat.id.toString();
        const text2 = update.message.text.trim();
        const chatWhitelist = config.chatWhitelist || [];
        if (chatWhitelist.length > 0 && !chatWhitelist.includes(chatId)) {
          return res.status(403).json({ error: "Chat not authorized" });
        }
        if (text2 === "/start" || text2 === "/menu") {
          await sendTelegramMessage(
            chatId,
            '\u{1F3AF} *Expense Tracker Bot*\n\nWelcome! Use the menu buttons below to navigate.\n\n\u{1F4A1} You can also:\n\u2022 Type naturally: "Spent 50 AED on groceries"\n\u2022 Send receipt photos for auto-scanning\n\u2022 Send voice messages for hands-free entry\n\nYour chat ID: ' + chatId,
            createMainMenu2()
          );
          await storage.clearUserState(chatId);
          return res.status(200).send("OK");
        }
        const userState = await storage.getUserState(chatId);
        if (userState && userState.state && userState.state !== "awaiting_confirmation") {
          await handleTextMessage(chatId, text2, storage);
        } else {
          const { processTelegramMessage: processTelegramMessage2 } = await Promise.resolve().then(() => (init_telegram_ai(), telegram_ai_exports));
          await processTelegramMessage2(chatId, text2, storage);
        }
        return res.status(200).send("OK");
      }
      res.status(200).send("OK");
    } catch (error) {
      console.error("Error processing Telegram webhook:", error);
      const chatId = req.body?.message?.chat?.id || req.body?.callback_query?.message?.chat?.id;
      if (chatId) {
        await sendTelegramMessage(chatId, "\u274C An error occurred. Please try again.");
      }
      res.status(200).send("OK");
    }
  });
  app2.get("/api/settings/gemini", async (req, res) => {
    try {
      const config = await storage.getGeminiConfig();
      if (!config) {
        return res.json({
          isEnabled: false,
          apiKey: null
        });
      }
      res.json(config);
    } catch (error) {
      console.error("Error fetching Gemini config:", error);
      res.status(500).json({ error: "Failed to fetch Gemini configuration" });
    }
  });
  app2.put("/api/settings/gemini", async (req, res) => {
    try {
      const validatedData = insertGeminiConfigSchema.parse(req.body);
      const config = await storage.createOrUpdateGeminiConfig(validatedData);
      res.json(config);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error updating Gemini config:", error);
      res.status(500).json({ error: "Failed to update Gemini configuration" });
    }
  });
  app2.delete("/api/settings/gemini", async (req, res) => {
    try {
      const success = await storage.deleteGeminiConfig();
      if (!success) {
        return res.status(404).json({ error: "Gemini configuration not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting Gemini config:", error);
      res.status(500).json({ error: "Failed to delete Gemini configuration" });
    }
  });
  app2.get("/api/settings/openai", async (req, res) => {
    try {
      const config = await storage.getOpenAIConfig();
      if (!config) {
        return res.json({
          isEnabled: false,
          apiKey: null
        });
      }
      res.json(config);
    } catch (error) {
      console.error("Error fetching OpenAI config:", error);
      res.status(500).json({ error: "Failed to fetch OpenAI configuration" });
    }
  });
  app2.put("/api/settings/openai", async (req, res) => {
    try {
      const validatedData = insertOpenAIConfigSchema.parse(req.body);
      const config = await storage.createOrUpdateOpenAIConfig(validatedData);
      res.json(config);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Error updating OpenAI config:", error);
      res.status(500).json({ error: "Failed to update OpenAI configuration" });
    }
  });
  app2.delete("/api/settings/openai", async (req, res) => {
    try {
      const success = await storage.deleteOpenAIConfig();
      if (!success) {
        return res.status(404).json({ error: "OpenAI configuration not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting OpenAI config:", error);
      res.status(500).json({ error: "Failed to delete OpenAI configuration" });
    }
  });
  const httpServer = createServer(app2);
  await initializeTelegramBot(storage);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();

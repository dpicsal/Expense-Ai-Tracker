import type { IStorage } from './storage';
import { sendTelegramMessage, answerCallbackQuery, sendTelegramDocument } from './telegram-bot';
import { 
  createMainMenu, createFundsMenu, createPaymentsMenu, createBackupMenu, 
  createSelectionKeyboard, createCancelMenu, createBackButton 
} from './telegram-bot-menus';
import ExcelJS from 'exceljs';

export async function handleCallbackQuery(
  callbackQueryId: string,
  chatId: string,
  callbackData: string,
  storage: IStorage
): Promise<void> {
  await answerCallbackQuery(callbackQueryId);

  // AI confirmation handlers
  if (callbackData === 'confirm_ai_action') {
    const userState = await storage.getUserState(chatId);
    if (userState?.state === 'awaiting_confirmation') {
      const pendingAction = JSON.parse(userState.data || '{}');
      
      try {
        // Execute the pending AI action directly
        const { executePendingAction } = await import('./telegram-ai');
        await executePendingAction(chatId, pendingAction, storage);
        
        // Clear state only after successful execution
        await storage.clearUserState(chatId);
      } catch (error) {
        console.error('[Telegram AI] Error executing pending action:', error);
        await sendTelegramMessage(
          chatId,
          '❌ An error occurred while processing your request. Please try again.',
          createMainMenu()
        );
        await storage.clearUserState(chatId);
      }
    }
    return;
  }

  if (callbackData === 'cancel_ai_action') {
    const userState = await storage.getUserState(chatId);
    if (userState?.state === 'awaiting_confirmation') {
      await storage.clearUserState(chatId);
      await sendTelegramMessage(
        chatId,
        '✅ Action cancelled. What else can I help you with?',
        createMainMenu()
      );
    }
    return;
  }

  // Main menu navigation
  if (callbackData === 'menu_main') {
    await sendTelegramMessage(
      chatId,
      '🏠 *Main Menu*\n\nSelect an option:',
      createMainMenu()
    );
    await storage.clearUserState(chatId);
    return;
  }

  if (callbackData === 'cancel') {
    await sendTelegramMessage(
      chatId,
      '❌ Operation cancelled.',
      createMainMenu()
    );
    await storage.clearUserState(chatId);
    return;
  }

  // Dashboard
  if (callbackData === 'menu_dashboard') {
    await handleDashboard(chatId, storage);
    return;
  }

  // Add Expense Flow - Start with category selection
  if (callbackData === 'menu_add_expense') {
    const categories = await storage.getAllCategories();
    if (categories.length === 0) {
      await sendTelegramMessage(
        chatId,
        '❌ No categories found. Please add categories in the web app first.',
        createMainMenu()
      );
      return;
    }
    await sendTelegramMessage(
      chatId,
      '➕ *Add Expense*\n\n📂 Select a category:',
      createSelectionKeyboard(categories, 'select_expense_category')
    );
    await storage.setUserState(chatId, 'add_expense_select_category');
    return;
  }

  // Funds Menu
  if (callbackData === 'menu_funds') {
    await sendTelegramMessage(
      chatId,
      '💰 *Manage Funds*\n\nChoose an option:',
      createFundsMenu()
    );
    return;
  }

  // Add fund to category
  if (callbackData === 'fund_add_category') {
    const categories = await storage.getAllCategories();
    if (categories.length === 0) {
      await sendTelegramMessage(
        chatId,
        '❌ No categories found.',
        createMainMenu()
      );
      return;
    }
    await sendTelegramMessage(
      chatId,
      '🏷️ *Add Funds to Category*\n\nSelect a category:',
      createSelectionKeyboard(categories, 'select_category_fund')
    );
    await storage.setUserState(chatId, 'select_category_for_fund');
    return;
  }

  // Add fund to cash
  if (callbackData === 'fund_add_cash') {
    const paymentMethods = await storage.getAllPaymentMethods();
    const cashMethod = paymentMethods.find(pm => pm.type === 'cash');
    if (!cashMethod) {
      await sendTelegramMessage(
        chatId,
        '❌ No cash payment method found.',
        createMainMenu()
      );
      return;
    }
    await sendTelegramMessage(
      chatId,
      '💵 *Add Funds to Cash*\n\nEnter the amount to add:',
      createCancelMenu()
    );
    await storage.setUserState(chatId, 'add_fund_cash_amount', { paymentMethodId: cashMethod.id });
    return;
  }

  // Add fund to debit card
  if (callbackData === 'fund_add_debit') {
    const paymentMethods = await storage.getAllPaymentMethods();
    const debitCards = paymentMethods.filter(pm => pm.type === 'debit_card');
    if (debitCards.length === 0) {
      await sendTelegramMessage(
        chatId,
        '❌ No debit cards found.',
        createMainMenu()
      );
      return;
    }
    await sendTelegramMessage(
      chatId,
      '🏦 *Add Deposit to Debit Card*\n\nSelect a debit card:',
      createSelectionKeyboard(debitCards, 'select_debit_fund')
    );
    await storage.setUserState(chatId, 'select_debit_for_fund');
    return;
  }

  // Reset category
  if (callbackData === 'fund_reset_category') {
    const categories = await storage.getAllCategories();
    if (categories.length === 0) {
      await sendTelegramMessage(
        chatId,
        '❌ No categories found.',
        createMainMenu()
      );
      return;
    }
    await sendTelegramMessage(
      chatId,
      '🔄 *Reset Category*\n\nSelect a category to reset:',
      createSelectionKeyboard(categories, 'confirm_reset_category')
    );
    await storage.setUserState(chatId, 'select_category_to_reset');
    return;
  }

  // Payments Menu
  if (callbackData === 'menu_payments_main') {
    await sendTelegramMessage(
      chatId,
      '💳 *Payments*\n\nChoose an option:',
      createPaymentsMenu()
    );
    return;
  }

  // Pay credit card
  if (callbackData === 'payment_credit_card') {
    const paymentMethods = await storage.getAllPaymentMethods();
    const creditCards = paymentMethods.filter(pm => pm.type === 'credit_card');
    if (creditCards.length === 0) {
      await sendTelegramMessage(
        chatId,
        '❌ No credit cards found.',
        createMainMenu()
      );
      return;
    }
    await sendTelegramMessage(
      chatId,
      '💳 *Pay Credit Card*\n\nSelect a credit card:',
      createSelectionKeyboard(creditCards, 'select_credit_payment')
    );
    await storage.setUserState(chatId, 'select_credit_for_payment');
    return;
  }

  // View payment methods
  if (callbackData === 'menu_payment_methods') {
    await handlePaymentMethods(chatId, storage);
    return;
  }

  // Categories
  if (callbackData === 'menu_categories') {
    await handleCategories(chatId, storage);
    return;
  }

  // Analytics
  if (callbackData === 'menu_analytics') {
    await handleAnalytics(chatId, storage);
    return;
  }

  // Backup Menu
  if (callbackData === 'menu_backup') {
    await sendTelegramMessage(
      chatId,
      '💾 *Backup & Export*\n\nChoose an option:',
      createBackupMenu()
    );
    return;
  }

  // JSON Backup
  if (callbackData === 'backup_json') {
    await handleJsonBackup(chatId, storage);
    return;
  }

  // Excel Export
  if (callbackData === 'backup_excel') {
    await handleExcelExport(chatId, storage);
    return;
  }

  // Reminders
  if (callbackData === 'menu_reminders') {
    await handleReminders(chatId, storage);
    return;
  }

  // Handle selection callbacks
  await handleSelectionCallback(chatId, callbackData, storage);
}

async function handleDashboard(chatId: string, storage: IStorage): Promise<void> {
  const allExpenses = await storage.getAllExpenses();
  const allCategories = await storage.getAllCategories();
  const allPaymentMethods = await storage.getAllPaymentMethods();
  
  const totalSpent = allExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const totalExpenses = allExpenses.length;
  const totalCategories = allCategories.length;
  const totalPaymentMethods = allPaymentMethods.length;
  
  const paymentMethodMap = new Map(allPaymentMethods.map(pm => [pm.id, pm.name]));
  
  const recentExpenses = allExpenses.slice(0, 5);
  let recentList = '';
  if (recentExpenses.length > 0) {
    recentList = recentExpenses.map(e => {
      const paymentMethodName = paymentMethodMap.get(e.paymentMethod) || e.paymentMethod;
      return `• AED ${parseFloat(e.amount).toFixed(2)} - ${e.description}\n  ${e.category} via ${paymentMethodName}`;
    }).join('\n\n');
  } else {
    recentList = 'No expenses yet';
  }
  
  await sendTelegramMessage(
    chatId,
    `📊 *Dashboard Summary*\n\n` +
    `💰 Total Spent: AED ${totalSpent.toFixed(2)}\n` +
    `📝 Total Expenses: ${totalExpenses}\n` +
    `🏷️ Categories: ${totalCategories}\n` +
    `💳 Payment Methods: ${totalPaymentMethods}\n\n` +
    `🕐 *Recent Expenses:*\n\n${recentList}`,
    createMainMenu()
  );
}

async function handleCategories(chatId: string, storage: IStorage): Promise<void> {
  const allCategories = await storage.getAllCategories();
  const allExpenses = await storage.getAllExpenses();
  
  let categoriesText = '🏷️ *Categories*\n\n';
  
  if (allCategories.length > 0) {
    allCategories.forEach(category => {
      const categoryExpenses = allExpenses.filter(e => e.category.trim() === category.name.trim());
      const total = categoryExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const allocatedFunds = category.allocatedFunds ? parseFloat(category.allocatedFunds) : 0;
      
      categoriesText += `${category.icon || '📌'} *${category.name}*\n`;
      if (allocatedFunds > 0) {
        categoriesText += `  Budget: AED ${allocatedFunds.toFixed(2)}\n`;
      }
      categoriesText += `  Spent: AED ${total.toFixed(2)} (${categoryExpenses.length} expenses)\n\n`;
    });
  } else {
    categoriesText += 'No categories found.';
  }
  
  await sendTelegramMessage(chatId, categoriesText, createMainMenu());
}

async function handlePaymentMethods(chatId: string, storage: IStorage): Promise<void> {
  const allPaymentMethods = await storage.getAllPaymentMethods();
  
  let paymentsText = '💳 *Payment Methods*\n\n';
  
  if (allPaymentMethods.length > 0) {
    allPaymentMethods.forEach(method => {
      const balance = method.balance ? parseFloat(method.balance) : 0;
      const typeIcon = method.type === 'credit_card' ? '💳' : 
                     method.type === 'debit_card' ? '🏦' : 
                     method.type === 'bank_account' ? '🏛️' : '💵';
      
      paymentsText += `${typeIcon} *${method.name}*\n`;
      paymentsText += `  Type: ${method.type.replace('_', ' ')}\n`;
      paymentsText += `  Balance: AED ${balance.toFixed(2)}\n`;
      
      if (method.type === 'credit_card' && method.creditLimit) {
        const creditLimit = parseFloat(method.creditLimit);
        const utilization = (balance / creditLimit * 100).toFixed(1);
        paymentsText += `  Credit Limit: AED ${creditLimit.toFixed(2)}\n`;
        paymentsText += `  Utilization: ${utilization}%\n`;
      }
      
      if (method.dueDate) {
        paymentsText += `  Due Date: Day ${method.dueDate} of month\n`;
      }
      
      paymentsText += '\n';
    });
  } else {
    paymentsText += 'No payment methods found.';
  }
  
  await sendTelegramMessage(chatId, paymentsText, createPaymentsMenu());
}

async function handleAnalytics(chatId: string, storage: IStorage): Promise<void> {
  const allExpenses = await storage.getAllExpenses();
  const allCategories = await storage.getAllCategories();
  
  const categoryStats = allCategories.map(category => {
    const categoryExpenses = allExpenses.filter(e => e.category.trim() === category.name.trim());
    const total = categoryExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    return { name: category.name, total, count: categoryExpenses.length };
  }).filter(stat => stat.count > 0).sort((a, b) => b.total - a.total);

  const totalSpent = allExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  
  let analyticsText = '📈 *Spending Analytics*\n\n';
  
  if (categoryStats.length > 0) {
    categoryStats.forEach(stat => {
      const percentage = totalSpent > 0 ? (stat.total / totalSpent * 100).toFixed(1) : '0';
      analyticsText += `${stat.name}\n`;
      analyticsText += `  AED ${stat.total.toFixed(2)} (${percentage}%) - ${stat.count} expenses\n\n`;
    });
  } else {
    analyticsText += 'No expenses to analyze yet.';
  }
  
  await sendTelegramMessage(chatId, analyticsText, createMainMenu());
}

async function handleJsonBackup(chatId: string, storage: IStorage): Promise<void> {
  const allExpenses = await storage.getAllExpenses();
  const allCategories = await storage.getAllCategories();
  const allPaymentMethods = await storage.getAllPaymentMethods();
  const allFundHistory = await storage.getAllFundHistory();
  
  const backupData = {
    expenses: allExpenses,
    categories: allCategories,
    paymentMethods: allPaymentMethods,
    fundHistory: allFundHistory,
    exportDate: new Date().toISOString(),
  };
  
  const backupText = JSON.stringify(backupData, null, 2);
  const fileName = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
  
  await sendTelegramDocument(
    chatId,
    fileName,
    backupText,
    `💾 *Backup Complete*\n\n` +
    `Expenses: ${allExpenses.length}\n` +
    `Categories: ${allCategories.length}\n` +
    `Payment Methods: ${allPaymentMethods.length}`,
    createMainMenu()
  );
}

async function handleExcelExport(chatId: string, storage: IStorage): Promise<void> {
  const allExpenses = await storage.getAllExpenses();
  const allCategories = await storage.getAllCategories();
  const allPaymentMethods = await storage.getAllPaymentMethods();

  const workbook = new ExcelJS.Workbook();
  
  // Expenses sheet
  const expensesSheet = workbook.addWorksheet('Expenses');
  expensesSheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Amount (AED)', key: 'amount', width: 15 },
    { header: 'Description', key: 'description', width: 30 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Payment Method', key: 'paymentMethod', width: 20 }
  ];

  const paymentMethodMap = new Map(allPaymentMethods.map(pm => [pm.id, pm.name]));
  
  allExpenses.forEach(expense => {
    expensesSheet.addRow({
      date: new Date(expense.date).toLocaleDateString(),
      amount: parseFloat(expense.amount),
      description: expense.description,
      category: expense.category,
      paymentMethod: paymentMethodMap.get(expense.paymentMethod) || expense.paymentMethod
    });
  });

  // Categories sheet
  const categoriesSheet = workbook.addWorksheet('Categories');
  categoriesSheet.columns = [
    { header: 'Name', key: 'name', width: 20 },
    { header: 'Allocated Funds (AED)', key: 'allocatedFunds', width: 20 },
    { header: 'Icon', key: 'icon', width: 10 }
  ];

  allCategories.forEach(category => {
    categoriesSheet.addRow({
      name: category.name,
      allocatedFunds: category.allocatedFunds ? parseFloat(category.allocatedFunds) : 0,
      icon: category.icon
    });
  });

  // Payment Methods sheet
  const paymentMethodsSheet = workbook.addWorksheet('Payment Methods');
  paymentMethodsSheet.columns = [
    { header: 'Name', key: 'name', width: 20 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Balance (AED)', key: 'balance', width: 15 },
    { header: 'Credit Limit (AED)', key: 'creditLimit', width: 20 },
    { header: 'Due Date', key: 'dueDate', width: 15 }
  ];

  allPaymentMethods.forEach(method => {
    paymentMethodsSheet.addRow({
      name: method.name,
      type: method.type,
      balance: method.balance ? parseFloat(method.balance) : 0,
      creditLimit: method.creditLimit ? parseFloat(method.creditLimit) : '',
      dueDate: method.dueDate ? `Day ${method.dueDate}` : ''
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `expense-tracker-${new Date().toISOString().split('T')[0]}.xlsx`;
  
  await sendTelegramDocument(
    chatId,
    fileName,
    Buffer.from(buffer),
    `📊 *Excel Export Complete*\n\n` +
    `Expenses: ${allExpenses.length}\n` +
    `Categories: ${allCategories.length}\n` +
    `Payment Methods: ${allPaymentMethods.length}`,
    createMainMenu()
  );
}

async function handleReminders(chatId: string, storage: IStorage): Promise<void> {
  const allPaymentMethods = await storage.getAllPaymentMethods();
  const creditCards = allPaymentMethods.filter(pm => pm.type === 'credit_card' && pm.dueDate);

  let remindersText = '🔔 *Payment Reminders*\n\n';

  if (creditCards.length === 0) {
    remindersText += 'No credit card payment reminders set.';
  } else {
    const today = new Date();
    const currentDay = today.getDate();

    creditCards.forEach(card => {
      const balance = card.balance ? parseFloat(card.balance) : 0;
      const dueDate = card.dueDate!;
      let daysUntilDue = dueDate - currentDay;
      if (daysUntilDue < 0) {
        daysUntilDue += 30;
      }

      const urgency = daysUntilDue <= 3 ? '🔴' : daysUntilDue <= 7 ? '🟡' : '🟢';

      remindersText += `${urgency} *${card.name}*\n`;
      remindersText += `  Balance: AED ${balance.toFixed(2)}\n`;
      remindersText += `  Due Date: Day ${dueDate}\n`;
      remindersText += `  Days Until Due: ${daysUntilDue}\n\n`;
    });
  }

  await sendTelegramMessage(chatId, remindersText, createMainMenu());
}

async function handleSelectionCallback(chatId: string, callbackData: string, storage: IStorage): Promise<void> {
  const [action, id] = callbackData.split(':');

  if (action === 'select_category_fund') {
    await sendTelegramMessage(
      chatId,
      '💰 *Add Funds to Category*\n\nEnter the amount to add:',
      createCancelMenu()
    );
    await storage.setUserState(chatId, 'add_fund_category_amount', { categoryId: id });
    return;
  }

  if (action === 'select_debit_fund') {
    await sendTelegramMessage(
      chatId,
      '🏦 *Add Deposit*\n\nEnter the amount to deposit:',
      createCancelMenu()
    );
    await storage.setUserState(chatId, 'add_fund_debit_amount', { paymentMethodId: id });
    return;
  }

  if (action === 'confirm_reset_category') {
    const result = await storage.resetCategory(id);
    await sendTelegramMessage(
      chatId,
      `✅ *Category Reset Successfully!*\n\n` +
      `Deleted ${result.deletedExpenses} expenses\n` +
      `Deleted ${result.deletedFundHistory} fund history records\n` +
      `Category funds reset to AED 0.00`,
      createMainMenu()
    );
    await storage.clearUserState(chatId);
    return;
  }

  if (action === 'select_credit_payment') {
    await sendTelegramMessage(
      chatId,
      '💳 *Pay Credit Card*\n\nEnter the payment amount:',
      createCancelMenu()
    );
    await storage.setUserState(chatId, 'pay_credit_amount', { paymentMethodId: id });
    return;
  }

  // Add Expense Flow - Category selection
  if (action === 'select_expense_category') {
    const category = await storage.getCategory(id);
    if (!category) {
      await sendTelegramMessage(chatId, '❌ Category not found.', createMainMenu());
      return;
    }
    
    const paymentMethods = await storage.getAllPaymentMethods();
    if (paymentMethods.length === 0) {
      await sendTelegramMessage(
        chatId,
        '❌ No payment methods found. Please add payment methods in the web app first.',
        createMainMenu()
      );
      return;
    }
    
    await sendTelegramMessage(
      chatId,
      '➕ *Add Expense*\n\n💳 Select payment method:',
      createSelectionKeyboard(paymentMethods, 'select_expense_payment')
    );
    await storage.setUserState(chatId, 'add_expense_select_payment', { 
      categoryId: id,
      categoryName: category.name
    });
    return;
  }

  // Add Expense Flow - Payment method selection
  if (action === 'select_expense_payment') {
    const userState = await storage.getUserState(chatId);
    if (!userState || !userState.data) {
      await sendTelegramMessage(chatId, '❌ Session expired. Please start again.', createMainMenu());
      return;
    }
    
    const data = JSON.parse(userState.data);
    const paymentMethod = await storage.getPaymentMethod(id);
    
    await sendTelegramMessage(
      chatId,
      '➕ *Add Expense*\n\n💵 Enter the amount (numbers only):',
      createCancelMenu()
    );
    await storage.setUserState(chatId, 'add_expense_amount', {
      ...data,
      paymentMethodId: id,
      paymentMethodName: paymentMethod?.name || 'Unknown'
    });
    return;
  }
}

export async function handleTextMessage(chatId: string, text: string, storage: IStorage): Promise<void> {
  const userState = await storage.getUserState(chatId);

  if (!userState || !userState.state) {
    await sendTelegramMessage(
      chatId,
      '👋 Welcome! Please use the menu buttons to navigate.',
      createMainMenu()
    );
    return;
  }

  const state = userState.state;
  const data = userState.data ? JSON.parse(userState.data) : {};

  // Add expense flow - Amount entry
  if (state === 'add_expense_amount') {
    const amount = parseFloat(text);
    if (isNaN(amount) || amount <= 0) {
      await sendTelegramMessage(
        chatId,
        '❌ Invalid amount. Please enter a positive number:',
        createCancelMenu()
      );
      return;
    }
    
    await sendTelegramMessage(
      chatId,
      '➕ *Add Expense*\n\n📝 Enter a description/note (or type "skip" to skip):',
      createCancelMenu()
    );
    await storage.setUserState(chatId, 'add_expense_description', {
      ...data,
      amount: amount.toString()
    });
    return;
  }

  // Add expense flow - Description entry (final step)
  if (state === 'add_expense_description') {
    const description = text.trim().toLowerCase() === 'skip' ? 'No description' : text.trim();
    
    // Create the expense
    const expense = await storage.createExpense({
      amount: data.amount,
      description: description,
      category: data.categoryName,
      paymentMethod: data.paymentMethodId,
      date: new Date()
    });

    await sendTelegramMessage(
      chatId,
      `✅ *Expense Added Successfully!*\n\n` +
      `Amount: AED ${parseFloat(expense.amount).toFixed(2)}\n` +
      `Description: ${expense.description}\n` +
      `Category: ${data.categoryName}\n` +
      `Payment: ${data.paymentMethodName}`,
      createMainMenu()
    );
    await storage.clearUserState(chatId);
    return;
  }

  // Add fund to category
  if (state === 'add_fund_category_amount') {
    const amount = parseFloat(text);
    if (isNaN(amount) || amount <= 0) {
      await sendTelegramMessage(
        chatId,
        '❌ Invalid amount. Please enter a positive number:',
        createCancelMenu()
      );
      return;
    }

    const result = await storage.addFundsToCategory(data.categoryId, amount);
    const category = result.updatedCategory;

    await sendTelegramMessage(
      chatId,
      `✅ *Funds Added Successfully!*\n\n` +
      `Category: ${category.name}\n` +
      `Amount Added: AED ${amount.toFixed(2)}\n` +
      `New Balance: AED ${parseFloat(category.allocatedFunds || '0').toFixed(2)}`,
      createMainMenu()
    );
    await storage.clearUserState(chatId);
    return;
  }

  // Add fund to cash/debit
  if (state === 'add_fund_cash_amount' || state === 'add_fund_debit_amount') {
    const amount = parseFloat(text);
    if (isNaN(amount) || amount <= 0) {
      await sendTelegramMessage(
        chatId,
        '❌ Invalid amount. Please enter a positive number:',
        createCancelMenu()
      );
      return;
    }

    const result = await storage.addFundsToPaymentMethod(data.paymentMethodId, amount);
    const paymentMethod = result.updatedPaymentMethod;

    await sendTelegramMessage(
      chatId,
      `✅ *Funds Added Successfully!*\n\n` +
      `${paymentMethod.name}\n` +
      `Amount Added: AED ${amount.toFixed(2)}\n` +
      `New Balance: AED ${parseFloat(paymentMethod.balance || '0').toFixed(2)}`,
      createMainMenu()
    );
    await storage.clearUserState(chatId);
    return;
  }

  // Pay credit card
  if (state === 'pay_credit_amount') {
    const amount = parseFloat(text);
    if (isNaN(amount) || amount <= 0) {
      await sendTelegramMessage(
        chatId,
        '❌ Invalid amount. Please enter a positive number:',
        createCancelMenu()
      );
      return;
    }

    // Reduce credit card balance (negative amount to reduce)
    const result = await storage.addFundsToPaymentMethod(data.paymentMethodId, -amount);
    const paymentMethod = result.updatedPaymentMethod;

    await sendTelegramMessage(
      chatId,
      `✅ *Payment Made Successfully!*\n\n` +
      `${paymentMethod.name}\n` +
      `Payment Amount: AED ${amount.toFixed(2)}\n` +
      `New Balance: AED ${parseFloat(paymentMethod.balance || '0').toFixed(2)}`,
      createMainMenu()
    );
    await storage.clearUserState(chatId);
    return;
  }

  // Default response
  await sendTelegramMessage(
    chatId,
    '❌ Invalid input. Please use the menu buttons.',
    createCancelMenu()
  );
}

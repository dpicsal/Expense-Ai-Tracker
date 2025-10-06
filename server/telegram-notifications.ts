import type { IStorage } from './storage';
import type { Expense, Category, PaymentMethod, FundHistory, PaymentMethodFundHistory } from '@shared/schema';
import { sendTelegramMessage } from './telegram-bot';

function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+=|{}.!])/g, '\\$1');
}

// Map Lucide icon names to emoji icons for Telegram
function getEmojiForIcon(iconName: string | null): string {
  const iconMap: Record<string, string> = {
    'Building2': '🏢',
    'Building': '🏢',
    'ShoppingCart': '🛒',
    'ShoppingBag': '🛍️',
    'Utensils': '🍽️',
    'Coffee': '☕',
    'Car': '🚗',
    'Bus': '🚌',
    'Plane': '✈️',
    'Home': '🏠',
    'Heart': '❤️',
    'Zap': '⚡',
    'Gamepad2': '🎮',
    'Film': '🎬',
    'Music': '🎵',
    'Book': '📚',
    'GraduationCap': '🎓',
    'Briefcase': '💼',
    'DollarSign': '💵',
    'CreditCard': '💳',
    'Wallet': '👛',
    'Gift': '🎁',
    'Tag': '🏷️',
    'Package': '📦',
    'Truck': '🚚',
    'Phone': '📱',
    'Laptop': '💻',
    'Monitor': '🖥️',
    'Watch': '⌚',
    'Activity': '📊',
    'TrendingUp': '📈',
    'Wrench': '🔧',
    'Hammer': '🔨',
    'Pill': '💊',
    'Stethoscope': '🩺',
    'Dumbbell': '🏋️',
    'Pizza': '🍕',
    'Beer': '🍺',
    'Wine': '🍷',
    'Shirt': '👕',
    'Scissors': '✂️',
    'Sparkles': '✨',
  };
  
  return iconMap[iconName || ''] || '🏷️';
}

export async function notifyTelegramExpenseCreated(
  expense: Expense,
  storage: IStorage
): Promise<void> {
  try {
    const config = await storage.getTelegramBotConfig();
    
    if (!config || !config.isEnabled || !config.botToken) {
      return;
    }

    const chatWhitelist = config.chatWhitelist || [];
    if (chatWhitelist.length === 0) {
      return;
    }

    const paymentMethod = await storage.getPaymentMethod(expense.paymentMethod);
    const paymentName = paymentMethod?.name || 'Unknown';

    const typeEmoji = paymentMethod ? {
      cash: '💵',
      credit_card: '💳',
      debit_card: '🏦',
      bank_transfer: '🏛️',
      digital_wallet: '📱'
    }[paymentMethod.type] || '💰' : '💰';

    const date = new Date(expense.date);
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

    // Get category information and calculate available amount
    const category = await storage.getCategoryByName(expense.category);
    let categoryInfo = '';
    
    if (category) {
      const categoryFundHistory = await storage.getFundHistoryByCategory(category.id);
      const totalAllocated = categoryFundHistory.reduce((sum, f) => sum + parseFloat(f.amount), 0);
      const allExpenses = await storage.getAllExpenses();
      const categoryExpenses = allExpenses.filter(e => e.category.trim() === expense.category.trim());
      const totalSpent = categoryExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const available = totalAllocated - totalSpent;
      
      categoryInfo = `📊 Total spend: *AED ${totalSpent.toFixed(2)}*\n✅ Available: *AED ${available.toFixed(2)}*`;
    }

    // Get payment method balance and total spend information
    let paymentInfo = '';
    if (paymentMethod) {
      const currentBalance = parseFloat(paymentMethod.balance || '0');
      
      // Calculate total spend for this payment method
      const allExpenses = await storage.getAllExpenses();
      const paymentExpenses = allExpenses.filter(e => e.paymentMethod === paymentMethod.name);
      const paymentTotalSpent = paymentExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      
      paymentInfo = `📊 Total spend: *AED ${paymentTotalSpent.toFixed(2)}*\n✅ Available: *AED ${currentBalance.toFixed(2)}*`;
    }

    const message = 
      `💰 *New Expense Added*\n\n` +
      `🏷️ Category: ${escapeMarkdown(expense.category)}\n` +
      `💵 Amount: *AED ${parseFloat(expense.amount).toFixed(2)}*\n` +
      `📝 Description: ${escapeMarkdown(expense.description)}\n` +
      `${categoryInfo}\n\n` +
      `${typeEmoji} Payment: ${escapeMarkdown(paymentName)}\n` +
      `${paymentInfo}\n` +
      `━━━━━━━━━━━━━━\n` +
      `📅 Date: ${formattedDate}`;

    for (const chatId of chatWhitelist) {
      try {
        await sendTelegramMessage(chatId, message);
      } catch (error) {
        console.error(`[Telegram Notification] Failed to send to ${chatId}:`, error);
      }
    }
  } catch (error) {
    console.error('[Telegram Notification] Error notifying expense:', error);
  }
}

export async function notifyTelegramCategoryCreated(
  category: Category,
  storage: IStorage
): Promise<void> {
  try {
    const config = await storage.getTelegramBotConfig();
    
    if (!config || !config.isEnabled || !config.botToken) {
      return;
    }

    const chatWhitelist = config.chatWhitelist || [];
    if (chatWhitelist.length === 0) {
      return;
    }

    const icon = getEmojiForIcon(category.icon);
    const message = 
      `🏷️ *New Category Created*\n\n` +
      `${icon} Name: *${escapeMarkdown(category.name)}*\n` +
      `💰 Allocated Funds: AED ${parseFloat(category.allocatedFunds || '0').toFixed(2)}` +
      (category.budget ? `\n📊 Budget: AED ${parseFloat(category.budget).toFixed(2)}` : '');

    for (const chatId of chatWhitelist) {
      try {
        await sendTelegramMessage(chatId, message);
      } catch (error) {
        console.error(`[Telegram Notification] Failed to send to ${chatId}:`, error);
      }
    }
  } catch (error) {
    console.error('[Telegram Notification] Error notifying category:', error);
  }
}

export async function notifyTelegramPaymentMethodCreated(
  paymentMethod: PaymentMethod,
  storage: IStorage
): Promise<void> {
  try {
    const config = await storage.getTelegramBotConfig();
    
    if (!config || !config.isEnabled || !config.botToken) {
      return;
    }

    const chatWhitelist = config.chatWhitelist || [];
    if (chatWhitelist.length === 0) {
      return;
    }

    const typeEmoji = {
      cash: '💵',
      credit_card: '💳',
      debit_card: '🏦',
      bank_transfer: '🏛️',
      digital_wallet: '📱'
    }[paymentMethod.type] || '💰';

    const typeName = paymentMethod.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const message = 
      `${typeEmoji} *New Payment Method Created*\n\n` +
      `${typeEmoji} Name: *${escapeMarkdown(paymentMethod.name)}*\n` +
      `📋 Type: ${typeName}\n` +
      `💰 Balance: AED ${parseFloat(paymentMethod.balance || '0').toFixed(2)}` +
      (paymentMethod.creditLimit ? `\n💳 Credit Limit: AED ${parseFloat(paymentMethod.creditLimit).toFixed(2)}` : '');

    for (const chatId of chatWhitelist) {
      try {
        await sendTelegramMessage(chatId, message);
      } catch (error) {
        console.error(`[Telegram Notification] Failed to send to ${chatId}:`, error);
      }
    }
  } catch (error) {
    console.error('[Telegram Notification] Error notifying payment method:', error);
  }
}

export async function notifyTelegramFundsAdded(
  fundHistory: FundHistory,
  updatedCategory: Category,
  storage: IStorage
): Promise<void> {
  try {
    const config = await storage.getTelegramBotConfig();
    
    if (!config || !config.isEnabled || !config.botToken) {
      return;
    }

    const chatWhitelist = config.chatWhitelist || [];
    if (chatWhitelist.length === 0) {
      return;
    }

    const allExpenses = await storage.getAllExpenses();
    const categoryExpenses = allExpenses.filter(e => e.category.trim() === updatedCategory.name.trim());
    const totalSpent = categoryExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    const available = parseFloat(updatedCategory.allocatedFunds || '0');
    const amountAdded = parseFloat(fundHistory.amount);

    const icon = getEmojiForIcon(updatedCategory.icon);
    
    const message = 
      `💰 *Funds Added to Category*\n\n` +
      `${icon} Category: *${escapeMarkdown(updatedCategory.name)}*\n` +
      `➕ Amount Added: *AED ${amountAdded.toFixed(2)}*\n` +
      (fundHistory.description ? `📝 Note: ${escapeMarkdown(fundHistory.description)}\n` : '') +
      `\n━━━━━━━━━━━━━━\n` +
      `📊 Total Spent: *AED ${totalSpent.toFixed(2)}*\n` +
      `✅ Available: *AED ${available.toFixed(2)}*`;

    for (const chatId of chatWhitelist) {
      try {
        await sendTelegramMessage(chatId, message);
      } catch (error) {
        console.error(`[Telegram Notification] Failed to send to ${chatId}:`, error);
      }
    }
  } catch (error) {
    console.error('[Telegram Notification] Error notifying funds added:', error);
  }
}

export async function notifyTelegramPaymentMethodFundsAdded(
  fundHistory: PaymentMethodFundHistory,
  updatedPaymentMethod: PaymentMethod,
  storage: IStorage
): Promise<void> {
  try {
    const config = await storage.getTelegramBotConfig();
    
    if (!config || !config.isEnabled || !config.botToken) {
      return;
    }

    const chatWhitelist = config.chatWhitelist || [];
    if (chatWhitelist.length === 0) {
      return;
    }

    const currentBalance = parseFloat(updatedPaymentMethod.balance || '0');
    const amountAdded = parseFloat(fundHistory.amount);

    const allFundHistory = await storage.getPaymentMethodFundHistoryByPaymentMethod(updatedPaymentMethod.id);
    const totalFundsAdded = allFundHistory.reduce((sum, f) => sum + parseFloat(f.amount), 0);

    const typeEmoji = {
      cash: '💵',
      credit_card: '💳',
      debit_card: '🏦',
      bank_transfer: '🏛️',
      digital_wallet: '📱'
    }[updatedPaymentMethod.type] || '💰';

    const date = new Date(fundHistory.addedAt);
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    
    const message = 
      `${typeEmoji} *New Funds Added*\n` +
      `📅 Date ${formattedDate}\n\n` +
      `${typeEmoji} Payment Method: *${escapeMarkdown(updatedPaymentMethod.name)}*\n` +
      `➕ Amount: *AED ${amountAdded.toFixed(2)}*\n` +
      (fundHistory.description ? `📝 Note: ${escapeMarkdown(fundHistory.description)}\n\n` : '\n') +
      `📈 Total Funds Add: *AED ${totalFundsAdded.toFixed(2)}*\n` +
      `━━━━━━━━━━━━━━\n` +
      `✅ Available: *AED ${currentBalance.toFixed(2)}*`;

    for (const chatId of chatWhitelist) {
      try {
        await sendTelegramMessage(chatId, message);
      } catch (error) {
        console.error(`[Telegram Notification] Failed to send to ${chatId}:`, error);
      }
    }
  } catch (error) {
    console.error('[Telegram Notification] Error notifying payment method funds added:', error);
  }
}

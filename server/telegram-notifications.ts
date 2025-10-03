import type { IStorage } from './storage';
import type { Expense, Category, PaymentMethod } from '@shared/schema';
import { sendTelegramMessage } from './telegram-bot';

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

    const message = 
      `💰 *New Expense Added*\n\n` +
      `Amount: AED ${parseFloat(expense.amount).toFixed(2)}\n` +
      `Category: ${expense.category}\n` +
      `Payment: ${expense.paymentMethod}\n` +
      `Description: ${expense.description}\n` +
      `Date: ${new Date(expense.date).toLocaleDateString()}`;

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

    const message = 
      `🏷️ *New Category Created*\n\n` +
      `Name: ${category.name}\n` +
      `Allocated Funds: AED ${parseFloat(category.allocatedFunds || '0').toFixed(2)}` +
      (category.budget ? `\nBudget: AED ${parseFloat(category.budget).toFixed(2)}` : '');

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

    const message = 
      `${typeEmoji} *New Payment Method Created*\n\n` +
      `Name: ${paymentMethod.name}\n` +
      `Type: ${paymentMethod.type.replace('_', ' ')}\n` +
      `Balance: AED ${parseFloat(paymentMethod.balance || '0').toFixed(2)}` +
      (paymentMethod.creditLimit ? `\nCredit Limit: AED ${parseFloat(paymentMethod.creditLimit).toFixed(2)}` : '');

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

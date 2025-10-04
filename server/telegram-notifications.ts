import type { IStorage } from './storage';
import type { Expense, Category, PaymentMethod } from '@shared/schema';
import { sendTelegramMessage } from './telegram-bot';

function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+=|{}.!])/g, '\\$1');
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

    const message = 
      `💰 *New Expense Added*\n\n` +
      `💵 Amount: *AED ${parseFloat(expense.amount).toFixed(2)}*\n` +
      `🏷️ Category: ${escapeMarkdown(expense.category)}\n` +
      `${typeEmoji} Payment: ${escapeMarkdown(paymentName)}\n` +
      `📝 Description: ${escapeMarkdown(expense.description)}\n` +
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

    const icon = category.icon || '🏷️';
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

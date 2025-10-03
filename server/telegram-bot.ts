import type { IStorage } from './storage';

interface TelegramMessage {
  chat_id: number | string;
  text: string;
  parse_mode?: 'Markdown' | 'HTML';
  reply_markup?: InlineKeyboardMarkup;
}

interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

let botToken: string | null = null;

export async function initializeTelegramBot(storage: IStorage) {
  try {
    const config = await storage.getTelegramBotConfig();
    
    if (!config || !config.isEnabled || !config.botToken) {
      console.log('[Telegram Bot] Bot is not enabled or token is missing');
      botToken = null;
      return;
    }

    botToken = config.botToken;
    console.log('[Telegram Bot] Bot configured successfully');
  } catch (error) {
    console.error('[Telegram Bot] Failed to initialize bot:', error);
    botToken = null;
  }
}

export async function sendTelegramMessage(chatId: number | string, text: string, replyMarkup?: InlineKeyboardMarkup): Promise<boolean> {
  if (!botToken) {
    console.log('[Telegram Bot] Cannot send message - bot not configured');
    return false;
  }

  try {
    const message: TelegramMessage = {
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
    };

    if (replyMarkup) {
      message.reply_markup = replyMarkup;
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Telegram Bot] Failed to send message:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Telegram Bot] Error sending message:', error);
    return false;
  }
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string): Promise<boolean> {
  if (!botToken) {
    console.log('[Telegram Bot] Cannot answer callback query - bot not configured');
    return false;
  }

  try {
    const payload: { callback_query_id: string; text?: string } = {
      callback_query_id: callbackQueryId,
    };

    if (text) {
      payload.text = text;
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Telegram Bot] Failed to answer callback query:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Telegram Bot] Error answering callback query:', error);
    return false;
  }
}

export function createInlineKeyboard(buttons: InlineKeyboardButton[][]): InlineKeyboardMarkup {
  return {
    inline_keyboard: buttons,
  };
}

export function createMainMenu(): InlineKeyboardMarkup {
  return createInlineKeyboard([
    [
      { text: '📊 Dashboard', callback_data: 'menu_dashboard' },
      { text: '➕ Add Expense', callback_data: 'menu_add' }
    ],
    [
      { text: '📈 Analytics', callback_data: 'menu_analytics' },
      { text: '🏷️ Categories', callback_data: 'menu_categories' }
    ],
    [
      { text: '💳 Payment Methods', callback_data: 'menu_payments' },
      { text: '💾 Backup', callback_data: 'menu_backup' }
    ]
  ]);
}

export async function sendTelegramDocument(
  chatId: number | string,
  fileName: string,
  fileContent: string,
  caption?: string,
  replyMarkup?: InlineKeyboardMarkup
): Promise<boolean> {
  if (!botToken) {
    console.log('[Telegram Bot] Cannot send document - bot not configured');
    return false;
  }

  try {
    const formData = new FormData();
    const blob = new Blob([fileContent], { type: 'application/json' });
    formData.append('chat_id', chatId.toString());
    formData.append('document', blob, fileName);
    
    if (caption) {
      formData.append('caption', caption);
    }
    
    if (replyMarkup) {
      formData.append('reply_markup', JSON.stringify(replyMarkup));
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Telegram Bot] Failed to send document:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Telegram Bot] Error sending document:', error);
    return false;
  }
}

export async function stopTelegramBot() {
  botToken = null;
  console.log('[Telegram Bot] Bot stopped');
}

export async function restartTelegramBot(storage: IStorage) {
  await stopTelegramBot();
  await initializeTelegramBot(storage);
}

export function isBotRunning(): boolean {
  return botToken !== null;
}

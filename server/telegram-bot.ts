import type { IStorage } from './storage';

interface TelegramMessage {
  chat_id: number | string;
  text: string;
  parse_mode?: 'Markdown' | 'HTML';
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

export async function sendTelegramMessage(chatId: number | string, text: string): Promise<boolean> {
  if (!botToken) {
    console.log('[Telegram Bot] Cannot send message - bot not configured');
    return false;
  }

  try {
    const message: TelegramMessage = {
      chat_id: chatId,
      text: text,
    };

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

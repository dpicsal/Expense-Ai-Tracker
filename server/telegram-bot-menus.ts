import type { IStorage } from './storage';
import { sendTelegramMessage, answerCallbackQuery, createInlineKeyboard, sendTelegramDocument } from './telegram-bot';

export function createMainMenu() {
  return createInlineKeyboard([
    [
      { text: '📊 Dashboard', callback_data: 'menu_dashboard' },
      { text: '➕ Add Expense', callback_data: 'menu_add_expense' }
    ],
    [
      { text: '💰 Manage Funds', callback_data: 'menu_funds' },
      { text: '💳 Payments', callback_data: 'menu_payments_main' }
    ],
    [
      { text: '🏷️ Categories', callback_data: 'menu_categories' },
      { text: '📈 Analytics', callback_data: 'menu_analytics' }
    ],
    [
      { text: '💾 Backup/Export', callback_data: 'menu_backup' },
      { text: '🔔 Reminders', callback_data: 'menu_reminders' }
    ]
  ]);
}

export function createFundsMenu() {
  return createInlineKeyboard([
    [
      { text: '➕ Add to Category', callback_data: 'fund_add_category' },
      { text: '💵 Add to Cash', callback_data: 'fund_add_cash' }
    ],
    [
      { text: '🏦 Add to Debit Card', callback_data: 'fund_add_debit' },
      { text: '🔄 Reset Category', callback_data: 'fund_reset_category' }
    ],
    [
      { text: '🏠 Main Menu', callback_data: 'menu_main' }
    ]
  ]);
}

export function createPaymentsMenu() {
  return createInlineKeyboard([
    [
      { text: '💳 Pay Credit Card', callback_data: 'payment_credit_card' },
      { text: '📋 View Methods', callback_data: 'menu_payment_methods' }
    ],
    [
      { text: '🏠 Main Menu', callback_data: 'menu_main' }
    ]
  ]);
}

export function createCategoriesMenu() {
  return createInlineKeyboard([
    [
      { text: '📋 View All', callback_data: 'categories_view' },
      { text: '🏠 Main Menu', callback_data: 'menu_main' }
    ]
  ]);
}

export function createBackupMenu() {
  return createInlineKeyboard([
    [
      { text: '💾 Backup (JSON)', callback_data: 'backup_json' },
      { text: '📊 Export Excel', callback_data: 'backup_excel' }
    ],
    [
      { text: '🏠 Main Menu', callback_data: 'menu_main' }
    ]
  ]);
}

export function createCancelMenu() {
  return createInlineKeyboard([
    [
      { text: '❌ Cancel', callback_data: 'cancel' }
    ]
  ]);
}

export function createBackButton() {
  return createInlineKeyboard([
    [
      { text: '🏠 Main Menu', callback_data: 'menu_main' }
    ]
  ]);
}

// Helper to create selection keyboards
export function createSelectionKeyboard(items: Array<{id: string, name: string}>, callbackPrefix: string, maxPerRow: number = 2) {
  const rows: any[][] = [];
  for (let i = 0; i < items.length; i += maxPerRow) {
    const row = items.slice(i, i + maxPerRow).map(item => ({
      text: item.name,
      callback_data: `${callbackPrefix}:${item.id}`
    }));
    rows.push(row);
  }
  rows.push([{ text: '❌ Cancel', callback_data: 'cancel' }]);
  return createInlineKeyboard(rows);
}

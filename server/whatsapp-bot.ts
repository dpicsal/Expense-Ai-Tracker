import type { IStorage } from './storage';
import crypto from 'crypto';

interface WhatsappMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text' | 'interactive';
  text?: {
    body: string;
  };
  interactive?: {
    type: 'button' | 'list';
    body?: {
      text: string;
    };
    action: {
      buttons?: Array<{
        type: 'reply';
        reply: {
          id: string;
          title: string;
        };
      }>;
      button?: string;
      sections?: Array<{
        title?: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
    };
  };
}

interface WhatsappConfig {
  appId: string | null;
  appSecret: string | null;
  accessToken: string | null;
  phoneNumberId: string | null;
  verifyToken: string | null;
}

let whatsappConfig: WhatsappConfig = {
  appId: null,
  appSecret: null,
  accessToken: null,
  phoneNumberId: null,
  verifyToken: null,
};

function getWebhookUrl(): string | null {
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    const baseUrl = appUrl.replace(/\/$/, '');
    return `${baseUrl}/api/integrations/whatsapp/webhook`;
  }
  
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) {
    const domains = replitDomains.split(',');
    const primaryDomain = domains[0];
    return `https://${primaryDomain}/api/integrations/whatsapp/webhook`;
  }
  
  console.error('[WhatsApp Bot] APP_URL or REPLIT_DOMAINS environment variable not found');
  return null;
}

export function getWhatsappWebhookUrl(): string | null {
  return getWebhookUrl();
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!whatsappConfig.appSecret) {
    console.error('[WhatsApp Bot] Cannot verify signature - app secret not configured');
    return false;
  }

  if (!signature || !signature.startsWith('sha256=')) {
    console.error('[WhatsApp Bot] Invalid signature format');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', whatsappConfig.appSecret)
    .update(payload)
    .digest('hex');

  const expectedBuffer = Buffer.from(`sha256=${expectedSignature}`);
  const receivedBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== receivedBuffer.length) {
    console.error('[WhatsApp Bot] Signature length mismatch');
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function initializeWhatsappBot(storage: IStorage) {
  try {
    const config = await storage.getWhatsappBotConfig();
    
    if (!config || !config.isEnabled || !config.accessToken || !config.phoneNumberId) {
      console.log('[WhatsApp Bot] Bot is not enabled or required fields are missing');
      whatsappConfig = {
        appId: null,
        appSecret: null,
        accessToken: null,
        phoneNumberId: null,
        verifyToken: null,
      };
      return;
    }

    whatsappConfig = {
      appId: config.appId || null,
      appSecret: config.appSecret || null,
      accessToken: config.accessToken,
      phoneNumberId: config.phoneNumberId,
      verifyToken: config.verifyToken || null,
    };

    console.log('[WhatsApp Bot] Bot configured successfully');
    console.log('[WhatsApp Bot] Webhook URL:', getWebhookUrl());
  } catch (error) {
    console.error('[WhatsApp Bot] Failed to initialize bot:', error);
    whatsappConfig = {
      appId: null,
      appSecret: null,
      accessToken: null,
      phoneNumberId: null,
      verifyToken: null,
    };
  }
}

export async function sendWhatsappMessage(to: string, text: string): Promise<boolean> {
  if (!whatsappConfig.accessToken || !whatsappConfig.phoneNumberId) {
    console.log('[WhatsApp Bot] Cannot send message - bot not configured');
    return false;
  }

  try {
    const message: WhatsappMessage = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: {
        body: text,
      },
    };

    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
    const url = `https://graph.facebook.com/${apiVersion}/${whatsappConfig.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappConfig.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[WhatsApp Bot] Failed to send message:', errorData);
      return false;
    }

    const data = await response.json();
    console.log('[WhatsApp Bot] Message sent successfully:', data);
    return true;
  } catch (error) {
    console.error('[WhatsApp Bot] Error sending message:', error);
    return false;
  }
}

export async function sendWhatsappMenu(to: string, bodyText: string, buttonText: string, sections: Array<{
  title?: string;
  rows: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}>): Promise<boolean> {
  if (!whatsappConfig.accessToken || !whatsappConfig.phoneNumberId) {
    console.log('[WhatsApp Bot] Cannot send menu - bot not configured');
    return false;
  }

  try {
    const message: WhatsappMessage = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: {
          text: bodyText
        },
        action: {
          button: buttonText,
          sections: sections
        }
      }
    };

    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
    const url = `https://graph.facebook.com/${apiVersion}/${whatsappConfig.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappConfig.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[WhatsApp Bot] Failed to send menu:', errorData);
      return false;
    }

    const data = await response.json();
    console.log('[WhatsApp Bot] Menu sent successfully:', data);
    return true;
  } catch (error) {
    console.error('[WhatsApp Bot] Error sending menu:', error);
    return false;
  }
}

export async function sendWhatsappButtons(to: string, bodyText: string, buttons: Array<{ id: string; title: string }>): Promise<boolean> {
  if (!whatsappConfig.accessToken || !whatsappConfig.phoneNumberId) {
    console.log('[WhatsApp Bot] Cannot send buttons - bot not configured');
    return false;
  }

  if (buttons.length > 3) {
    console.error('[WhatsApp Bot] Maximum 3 buttons allowed');
    return false;
  }

  try {
    const message: WhatsappMessage = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText
        },
        action: {
          buttons: buttons.map(btn => ({
            type: 'reply' as const,
            reply: {
              id: btn.id,
              title: btn.title
            }
          }))
        }
      }
    };

    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
    const url = `https://graph.facebook.com/${apiVersion}/${whatsappConfig.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappConfig.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[WhatsApp Bot] Failed to send buttons:', errorData);
      return false;
    }

    const data = await response.json();
    console.log('[WhatsApp Bot] Buttons sent successfully:', data);
    return true;
  } catch (error) {
    console.error('[WhatsApp Bot] Error sending buttons:', error);
    return false;
  }
}

export async function markMessageAsRead(messageId: string): Promise<boolean> {
  if (!whatsappConfig.accessToken || !whatsappConfig.phoneNumberId) {
    console.log('[WhatsApp Bot] Cannot mark message as read - bot not configured');
    return false;
  }

  try {
    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
    const url = `https://graph.facebook.com/${apiVersion}/${whatsappConfig.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappConfig.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[WhatsApp Bot] Failed to mark message as read:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[WhatsApp Bot] Error marking message as read:', error);
    return false;
  }
}

export async function stopWhatsappBot() {
  whatsappConfig = {
    appId: null,
    appSecret: null,
    accessToken: null,
    phoneNumberId: null,
    verifyToken: null,
  };
  console.log('[WhatsApp Bot] Bot stopped');
}

export async function restartWhatsappBot(storage: IStorage) {
  await stopWhatsappBot();
  await initializeWhatsappBot(storage);
}

export function isBotRunning(): boolean {
  return whatsappConfig.accessToken !== null && whatsappConfig.phoneNumberId !== null;
}

export function getVerifyToken(): string | null {
  return whatsappConfig.verifyToken;
}

export function getAppSecret(): string | null {
  return whatsappConfig.appSecret;
}

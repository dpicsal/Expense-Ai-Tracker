import { GoogleGenAI } from "@google/genai";
import type { IStorage } from './storage';
import type { InsertExpense } from '@shared/schema';

async function getGeminiAI(storage: IStorage): Promise<GoogleGenAI | null> {
  const config = await storage.getGeminiConfig();
  
  if (config) {
    if (!config.isEnabled) {
      console.log('[Telegram AI] Gemini AI is disabled in settings');
      return null;
    }
    
    if (config.apiKey) {
      return new GoogleGenAI({ apiKey: config.apiKey });
    }
  }
  
  const envApiKey = process.env.GEMINI_API_KEY;
  if (envApiKey) {
    return new GoogleGenAI({ apiKey: envApiKey });
  }
  
  return null;
}

export async function processTelegramMessage(
  message: string, 
  storage: IStorage, 
  imageBase64?: string
): Promise<string> {
  try {
    if (imageBase64) {
      return await handleReceiptImage(imageBase64, storage);
    }
    
    const { processWhatsAppMessage } = await import('./whatsapp-ai');
    return await processWhatsAppMessage(message, storage);
  } catch (error) {
    console.error('[Telegram AI] Error processing message:', error);
    return "Sorry, I encountered an error processing your request. Please try again.";
  }
}

async function handleReceiptImage(imageBase64: string, storage: IStorage): Promise<string> {
  try {
    const systemPrompt = `Analyze this receipt image and extract expense details.
Extract:
- Total amount (the final amount paid)
- Store/merchant name
- Category (Food, Shopping, Transport, Bills, Entertainment, etc.)
- Date (if visible)
- Individual items (optional)

Return JSON format.`;

    const ai = await getGeminiAI(storage);
    if (!ai) {
      console.error('[Telegram AI] Failed to get Gemini AI instance');
      return "❌ Gemini AI is not configured. Please configure your Gemini API key in settings.";
    }

    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            amount: { type: "number" },
            merchant: { type: "string" },
            category: { type: "string" },
            date: { type: "string" },
            items: { 
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["amount", "merchant", "category"]
        }
      },
      contents: [
        {
          inlineData: {
            data: imageBase64,
            mimeType: "image/jpeg"
          }
        },
        "Extract expense details from this receipt"
      ]
    });

    const rawJson = aiResponse.text;
    if (!rawJson) {
      return "❌ Could not read the receipt. Please make sure the image is clear.";
    }

    const receiptData = JSON.parse(rawJson);
    
    if (!receiptData.amount || receiptData.amount <= 0) {
      return "❌ Could not find a valid amount in the receipt. Please try again or enter manually.";
    }

    const categoryName = receiptData.category || 'Uncategorized';
    let category = await storage.getCategoryByName(categoryName);
    
    if (!category) {
      category = await storage.createCategory({
        name: categoryName,
        color: 'bg-blue-500',
        icon: 'Tag',
        allocatedFunds: 0
      });
    }

    const paymentMethods = await storage.getAllPaymentMethods();
    const defaultPayment = paymentMethods.find(pm => pm.type === 'cash') || paymentMethods[0];
    
    if (!defaultPayment) {
      return "❌ No payment methods found. Please create a payment method in the web app first.";
    }

    const expense: InsertExpense = {
      amount: receiptData.amount,
      category: categoryName,
      paymentMethod: defaultPayment.id,
      description: `${receiptData.merchant}${receiptData.items?.length ? ' - ' + receiptData.items.slice(0, 3).join(', ') : ''}`,
      date: receiptData.date ? new Date(receiptData.date) : new Date()
    };

    await storage.createExpense(expense);

    let responseText = `📸 *Receipt Scanned Successfully!*\n\n`;
    responseText += `✅ Expense Added:\n`;
    responseText += `💰 Amount: AED ${receiptData.amount.toFixed(2)}\n`;
    responseText += `🏪 Merchant: ${receiptData.merchant}\n`;
    responseText += `📁 Category: ${categoryName}\n`;
    responseText += `💳 Payment: ${defaultPayment.name}\n`;
    
    if (receiptData.items && receiptData.items.length > 0) {
      responseText += `\n📝 Items:\n`;
      receiptData.items.slice(0, 5).forEach((item: string) => {
        responseText += `  • ${item}\n`;
      });
      if (receiptData.items.length > 5) {
        responseText += `  ... and ${receiptData.items.length - 5} more\n`;
      }
    }

    return responseText;
  } catch (error) {
    console.error('[Telegram AI] Error processing receipt:', error);
    return "❌ Failed to process receipt image. Please try again or enter the expense manually.";
  }
}

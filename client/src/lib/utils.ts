import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as AED currency
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | string,
  options: { 
    showSymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
) {
  const {
    showSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return showSymbol ? 'AED 0.00' : '0.00';
  }
  
  const formatted = numericAmount.toFixed(maximumFractionDigits);
  
  return showSymbol ? `AED ${formatted}` : formatted;
}

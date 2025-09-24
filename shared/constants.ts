// Shared constants for the application

export const DEFAULT_CATEGORIES = [
  "Food & Dining",
  "Transportation", 
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Travel",
  "Education",
  "Other"
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "Transportation": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", 
  "Shopping": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "Entertainment": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  "Bills & Utilities": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "Healthcare": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Travel": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  "Education": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  "Other": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export const CATEGORY_GRADIENT_COLORS: Record<string, string> = {
  "Food & Dining": "bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-orange-200 dark:shadow-orange-900",
  "Transportation": "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-200 dark:shadow-blue-900",
  "Shopping": "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-purple-200 dark:shadow-purple-900",
  "Entertainment": "bg-gradient-to-r from-pink-600 to-pink-700 text-white shadow-pink-200 dark:shadow-pink-900",
  "Bills & Utilities": "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-red-200 dark:shadow-red-900",
  "Healthcare": "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-green-200 dark:shadow-green-900",
  "Travel": "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-cyan-200 dark:shadow-cyan-900",
  "Education": "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-indigo-200 dark:shadow-indigo-900",
  "Other": "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-gray-200 dark:shadow-gray-900",
};

export const COLOR_OPTIONS = [
  { value: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", label: "Orange" },
  { value: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", label: "Blue" },
  { value: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", label: "Purple" },
  { value: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200", label: "Pink" },
  { value: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "Red" },
  { value: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "Green" },
  { value: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200", label: "Cyan" },
  { value: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200", label: "Indigo" },
  { value: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200", label: "Gray" },
];

export const PAYMENT_METHOD_COLOR_OPTIONS = [
  { value: "bg-blue-100", label: "Blue", color: "bg-blue-500" },
  { value: "bg-green-100", label: "Green", color: "bg-green-500" },
  { value: "bg-purple-100", label: "Purple", color: "bg-purple-500" },
  { value: "bg-orange-100", label: "Orange", color: "bg-orange-500" },
  { value: "bg-pink-100", label: "Pink", color: "bg-pink-500" },
  { value: "bg-cyan-100", label: "Cyan", color: "bg-cyan-500" },
  { value: "bg-yellow-100", label: "Yellow", color: "bg-yellow-500" },
  { value: "bg-red-100", label: "Red", color: "bg-red-500" },
  { value: "bg-gray-100", label: "Gray", color: "bg-gray-500" },
];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  "cash": "Cash",
  "credit_card": "Credit Card", 
  "debit_card": "Debit Card",
  "bank_transfer": "Bank Transfer",
  "digital_wallet": "Digital Wallet",
  "other": "Other",
};
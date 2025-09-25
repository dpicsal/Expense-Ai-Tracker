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
  "Food & Dining": "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
  "Transportation": "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  "Shopping": "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
  "Entertainment": "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  "Bills & Utilities": "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
  "Healthcare": "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
  "Travel": "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
  "Education": "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
  "Other": "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800",
};

export const CATEGORY_GRADIENT_COLORS: Record<string, string> = {
  "Food & Dining": "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
  "Transportation": "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  "Shopping": "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
  "Entertainment": "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  "Bills & Utilities": "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800",
  "Healthcare": "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
  "Travel": "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
  "Education": "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
  "Other": "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800",
};

export const COLOR_OPTIONS = [
  { value: "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800", label: "Orange" },
  { value: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800", label: "Blue" },
  { value: "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800", label: "Purple" },
  { value: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800", label: "Emerald" },
  { value: "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800", label: "Rose" },
  { value: "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800", label: "Teal" },
  { value: "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800", label: "Sky" },
  { value: "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800", label: "Violet" },
  { value: "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800", label: "Slate" },
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
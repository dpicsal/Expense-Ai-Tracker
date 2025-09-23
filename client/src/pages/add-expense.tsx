import { ExpenseForm } from "@/components/expense-form";
import { type InsertExpense } from "@shared/schema";

export default function AddExpense() {
  const handleSubmit = (expense: InsertExpense) => {
    console.log('New expense:', expense);
    // todo: remove mock functionality - integrate with backend
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Expense</h1>
        <p className="text-muted-foreground">
          Record a new expense to track your spending
        </p>
      </div>

      <div className="max-w-2xl">
        <ExpenseForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
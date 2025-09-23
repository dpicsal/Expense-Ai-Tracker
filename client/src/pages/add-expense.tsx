import { ExpenseForm } from "@/components/expense-form";
import { useToast } from "@/hooks/use-toast";
import { useCreateExpense } from "@/hooks/use-expenses";
import { type InsertExpense } from "@shared/schema";

export default function AddExpense() {
  const { toast } = useToast();
  const createExpense = useCreateExpense();

  const handleSubmit = async (expense: InsertExpense) => {
    try {
      await createExpense.mutateAsync(expense);
      toast({
        title: "Success",
        description: "Expense added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Add Expense
        </h1>
        <p className="text-lg text-muted-foreground">
          Record a new expense to track your spending effectively
        </p>
      </div>

      <div className="max-w-2xl">
        <ExpenseForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
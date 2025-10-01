import { ExpenseForm } from "@/components/expense-form";
import { useToast } from "@/hooks/use-toast";
import { useCreateExpense } from "@/hooks/use-expenses";
import { useIsMobile } from "@/hooks/use-mobile";
import { type InsertExpense } from "@shared/schema";

export default function AddExpense() {
  const { toast } = useToast();
  const createExpense = useCreateExpense();
  const isMobile = useIsMobile();

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
    <div className={`${isMobile ? 'space-y-5' : 'space-y-8'} animate-slide-in-right`}>
      <div className="space-y-1">
        <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl'} font-semibold tracking-tight text-foreground`}>
          Add Expense
        </h1>
        <p className={`${isMobile ? 'text-sm' : 'text-base sm:text-lg'} text-muted-foreground`}>
          Record a new expense to track your spending effectively
        </p>
      </div>

      <div className={isMobile ? '' : 'max-w-2xl'}>
        <ExpenseForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
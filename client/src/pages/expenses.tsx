import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseList } from "@/components/expense-list";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useExpenses, useUpdateExpense, useDeleteExpense, useCreateExpense } from "@/hooks/use-expenses";
import { type Expense, type InsertExpense } from "@shared/schema";

export default function Expenses() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const { data: expenses = [], isLoading } = useExpenses();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const createExpense = useCreateExpense();

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsDialogOpen(true);
  };

  const handleUpdateExpense = async (updatedExpense: InsertExpense) => {
    if (!editingExpense) return;
    
    try {
      await updateExpense.mutateAsync({
        id: editingExpense.id,
        expense: updatedExpense,
      });
      setIsDialogOpen(false);
      setEditingExpense(null);
      toast({
        title: "Success",
        description: "Expense updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpense.mutateAsync(id);
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const handleCreateExpense = async (expense: InsertExpense) => {
    try {
      await createExpense.mutateAsync(expense);
      setIsAddExpenseDialogOpen(false);
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
    <div className={`${isMobile ? 'space-y-6' : 'space-y-8'} animate-fade-in-up`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground">
            All Expenses
          </h1>
          <p className="text-base md:text-lg font-normal text-muted-foreground">
            View and manage all your expenses
          </p>
        </div>
        <Button 
          onClick={() => setIsAddExpenseDialogOpen(true)}
          className="gap-2"
          data-testid="button-add-expense"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* All Expenses */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg md:text-xl font-semibold">
            Expense History ({expenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-ios-spinner"></div>
                <div className="animate-pulse-glow">Loading expenses...</div>
              </div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <Plus className="w-12 h-12 opacity-50" />
                <div>
                  <p className="text-lg font-medium">No expenses yet</p>
                  <p className="text-sm">Start tracking by adding your first expense</p>
                </div>
              </div>
            </div>
          ) : (
            <ExpenseList
              expenses={expenses}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={isAddExpenseDialogOpen} onOpenChange={setIsAddExpenseDialogOpen}>
        <DialogContent className="max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Record a new expense transaction.
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm
            onSubmit={handleCreateExpense}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Modify the details of your expense.
            </DialogDescription>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm
              onSubmit={handleUpdateExpense}
              initialData={{
                ...editingExpense,
                amount: parseFloat(editingExpense.amount)
              }}
              isEditing
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

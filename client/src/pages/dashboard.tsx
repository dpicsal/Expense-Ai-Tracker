import { useState } from "react";
import { PlusCircle, TrendingDown, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseCharts } from "@/components/expense-charts";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseList } from "@/components/expense-list";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from "@/hooks/use-expenses";
import { type Expense, type InsertExpense } from "@shared/schema";

export default function Dashboard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const { toast } = useToast();
  
  const { data: expenses = [], isLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const handleAddExpense = async (newExpense: InsertExpense) => {
    try {
      await createExpense.mutateAsync(newExpense);
      setIsDialogOpen(false);
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

  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const thisMonthExpenses = expenses.filter(expense => {
    const expenseMonth = new Date(expense.date).getMonth();
    const currentMonth = new Date().getMonth();
    return expenseMonth === currentMonth;
  });
  const thisMonthTotal = thisMonthExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  const lastMonthExpenses = expenses.filter(expense => {
    const expenseMonth = new Date(expense.date).getMonth();
    const lastMonth = new Date().getMonth() - 1;
    return expenseMonth === lastMonth;
  });
  const lastMonthTotal = lastMonthExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  const monthlyChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your expenses and visualize your spending patterns
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingExpense(null);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-expense">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </DialogTitle>
            </DialogHeader>
            <ExpenseForm 
              onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
              initialData={editingExpense ? {
                amount: parseFloat(editingExpense.amount),
                description: editingExpense.description,
                category: editingExpense.category,
                date: new Date(editingExpense.date),
              } : undefined}
              isEditing={!!editingExpense}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="total-expenses">
              ${totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {expenses.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="month-expenses">
              ${thisMonthTotal.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {thisMonthExpenses.length} transactions this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Change</CardTitle>
            {monthlyChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-destructive" />
            ) : (
              <TrendingDown className="h-4 w-4 text-chart-2" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums" data-testid="monthly-change">
              {monthlyChange > 0 ? '+' : ''}{monthlyChange.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {monthlyChange >= 0 ? 'Increase' : 'Decrease'} from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <ExpenseCharts expenses={expenses} />

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading expenses...
            </div>
          ) : (
            <ExpenseList
              expenses={expenses.slice(0, 10)}
              onEdit={handleEditExpense}
              onDelete={handleDeleteExpense}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
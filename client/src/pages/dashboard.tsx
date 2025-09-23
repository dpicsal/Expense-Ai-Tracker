import { useState } from "react";
import { PlusCircle, TrendingDown, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExpenseCharts } from "@/components/expense-charts";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseList } from "@/components/expense-list";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { type Expense, type InsertExpense } from "@shared/schema";

export default function Dashboard() {
  // todo: remove mock functionality
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      amount: '45.50',
      description: 'Lunch at downtown restaurant',
      category: 'Food & Dining',
      date: new Date('2024-01-15'),
    },
    {
      id: '2',
      amount: '85.00',
      description: 'Gas station fill-up',
      category: 'Transportation',
      date: new Date('2024-01-14'),
    },
    {
      id: '3',
      amount: '120.00',
      description: 'Grocery shopping for the week',
      category: 'Shopping',
      date: new Date('2024-01-13'),
    },
    {
      id: '4',
      amount: '25.00',
      description: 'Movie tickets',
      category: 'Entertainment',
      date: new Date('2024-02-01'),
    },
    {
      id: '5',
      amount: '150.00',
      description: 'Electric bill',
      category: 'Bills & Utilities',
      date: new Date('2024-02-05'),
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddExpense = (newExpense: InsertExpense) => {
    console.log('Adding expense:', newExpense);
    const expense: Expense = {
      id: Date.now().toString(),
      ...newExpense,
      amount: newExpense.amount.toString(),
    };
    setExpenses(prev => [expense, ...prev]);
    setIsDialogOpen(false);
  };

  const handleEditExpense = (expense: Expense) => {
    console.log('Edit expense:', expense);
    // Implementation would go here
  };

  const handleDeleteExpense = (id: string) => {
    console.log('Delete expense:', id);
    setExpenses(prev => prev.filter(exp => exp.id !== id));
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-expense">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <ExpenseForm onSubmit={handleAddExpense} />
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
          <ExpenseList
            expenses={expenses.slice(0, 10)}
            onEdit={handleEditExpense}
            onDelete={handleDeleteExpense}
          />
        </CardContent>
      </Card>
    </div>
  );
}
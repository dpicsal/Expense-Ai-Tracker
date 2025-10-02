import { useState } from "react";
import { TrendingDown, TrendingUp, DollarSign, Plus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseForm } from "@/components/expense-form";
import { ExpenseList } from "@/components/expense-list";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useExpenses, useUpdateExpense, useDeleteExpense, useCreateExpense } from "@/hooks/use-expenses";
import { useCategories } from "@/hooks/use-categories";
import { type Expense, type InsertExpense, type Category } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import * as Icons from "lucide-react";

export default function Dashboard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const { data: expenses = [], isLoading } = useExpenses();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
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

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setIsAddExpenseDialogOpen(true);
  };

  const handleCreateExpense = async (expense: InsertExpense) => {
    try {
      await createExpense.mutateAsync(expense);
      setIsAddExpenseDialogOpen(false);
      setSelectedCategory("");
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

  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const thisMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const expenseMonth = expenseDate.getMonth();
    const expenseYear = expenseDate.getFullYear();
    return expenseMonth === currentMonth && expenseYear === currentYear;
  });
  const thisMonthTotal = thisMonthExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  // Handle last month calculation with year transition
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  const lastMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const expenseMonth = expenseDate.getMonth();
    const expenseYear = expenseDate.getFullYear();
    return expenseMonth === lastMonth && expenseYear === lastMonthYear;
  });
  const lastMonthTotal = lastMonthExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  const monthlyChange = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  // Calculate spending statistics per category
  const categoryStats = categories.map(category => {
    const categoryExpenses = expenses.filter(expense => expense.category === category.name);
    const totalSpent = categoryExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const transactionCount = categoryExpenses.length;
    
    return {
      ...category,
      totalSpent,
      transactionCount
    };
  });

  return (
    <div className={`${isMobile ? 'space-y-6' : 'space-y-8'} animate-fade-in-up`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-base md:text-lg font-normal text-muted-foreground">
            Track your expenses and visualize your spending patterns
          </p>
        </div>
      </div>


      {/* Summary Cards */}
      <div className={`grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-3 ${isMobile ? 'gap-3' : 'gap-4 sm:gap-5 lg:gap-6'}`}>
        <Card className={`border-0 shadow-ios-sm bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-md stagger-fade-in ${isMobile ? 'min-h-[7rem]' : ''}`}>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'pb-2 px-4 pt-4' : 'pb-3'}`}>
            <CardTitle className={`text-sm font-medium text-muted-foreground ${isMobile ? 'text-xs' : ''}`}>Total Expenses</CardTitle>
            <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-xl bg-primary/10 shadow-sm`}>
              <DollarSign className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-primary`} />
            </div>
          </CardHeader>
          <CardContent className={isMobile ? 'px-4 pb-4' : ''}>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl md:text-3xl'} font-bold tabular-nums tracking-tight`} data-testid="total-expenses">
              {formatCurrency(totalExpenses)}
            </div>
            <p className={`${isMobile ? 'text-xs mt-1' : 'text-sm mt-2'} text-muted-foreground flex items-center gap-1`}>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary"></span>
              Across {expenses.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-ios-sm bg-gradient-to-br from-blue-50/95 to-blue-100/90 dark:from-blue-950/95 dark:to-blue-900/90 backdrop-blur-md stagger-fade-in ${isMobile ? 'min-h-[7rem]' : ''}`}>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'pb-2 px-4 pt-4' : 'pb-3'}`}>
            <CardTitle className={`text-sm font-medium text-blue-700 dark:text-blue-300 ${isMobile ? 'text-xs' : ''}`}>This Month</CardTitle>
            <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-xl bg-blue-500/10 shadow-sm`}>
              <TrendingUp className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-blue-600 dark:text-blue-400`} />
            </div>
          </CardHeader>
          <CardContent className={isMobile ? 'px-4 pb-4' : ''}>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl md:text-3xl'} font-bold tabular-nums tracking-tight text-blue-900 dark:text-blue-100`} data-testid="month-expenses">
              {formatCurrency(thisMonthTotal)}
            </div>
            <p className={`${isMobile ? 'text-xs mt-1' : 'text-sm mt-2'} text-blue-600 dark:text-blue-400 flex items-center gap-1`}>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {thisMonthExpenses.length} transactions this month
            </p>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-ios-sm backdrop-blur-md stagger-fade-in ${isMobile ? 'min-h-[7rem]' : ''} ${
          monthlyChange >= 0 
            ? 'bg-gradient-to-br from-red-50/95 to-red-100/90 dark:from-red-950/95 dark:to-red-900/90' 
            : 'bg-gradient-to-br from-green-50/95 to-green-100/90 dark:from-green-950/95 dark:to-green-900/90'
        }`}>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'pb-2 px-4 pt-4' : 'pb-3'}`}>
            <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium ${
              monthlyChange >= 0 ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'
            }`}>
              Monthly Change
            </CardTitle>
            <div className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-xl shadow-sm ${
              monthlyChange >= 0 ? 'bg-red-500/10' : 'bg-green-500/10'
            }`}>
              {monthlyChange >= 0 ? (
                <TrendingUp className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-red-600 dark:text-red-400`} />
              ) : (
                <TrendingDown className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-green-600 dark:text-green-400`} />
              )}
            </div>
          </CardHeader>
          <CardContent className={isMobile ? 'px-4 pb-4' : ''}>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl md:text-3xl'} font-bold tabular-nums tracking-tight ${
              monthlyChange >= 0 ? 'text-red-900 dark:text-red-100' : 'text-green-900 dark:text-green-100'
            }`} data-testid="monthly-change">
              {monthlyChange > 0 ? '+' : ''}{monthlyChange.toFixed(1)}%
            </div>
            <p className={`${isMobile ? 'text-xs mt-1' : 'text-sm mt-2'} flex items-center gap-1 ${
              monthlyChange >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
            }`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                monthlyChange >= 0 ? 'bg-red-500' : 'bg-green-500'
              }`}></span>
              {monthlyChange >= 0 ? 'Increase' : 'Decrease'} from last month
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Categories Section */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg md:text-xl font-semibold">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-ios-spinner"></div>
                <div className="animate-pulse-glow">Loading categories...</div>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <Plus className="w-12 h-12 opacity-50" />
                <div>
                  <p className="text-lg font-medium">No categories yet</p>
                  <p className="text-sm">Categories will appear here once created</p>
                </div>
              </div>
            </div>
          ) : (
            <div className={`grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${isMobile ? 'gap-3' : 'gap-4'}`}>
              {categoryStats.map((category) => {
                const IconComponent = Icons[category.icon as keyof typeof Icons] as React.ComponentType<any>;
                
                return (
                  <Card 
                    key={category.id} 
                    className={`${category.color} border-0 shadow-ios-sm backdrop-blur-md hover-elevate transition-all duration-200 cursor-pointer`}
                    onClick={() => handleCategoryClick(category.name)}
                    data-testid={`card-category-${category.id}`}
                  >
                    <CardContent className={`${isMobile ? 'p-4' : 'p-5'}`}>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {IconComponent && (
                            <div className="flex-shrink-0">
                              <IconComponent className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                            </div>
                          )}
                          <h3 
                            className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold truncate`}
                            data-testid={`text-category-name-${category.id}`}
                          >
                            {category.name}
                          </h3>
                        </div>
                      </div>
                      
                      {/* Spending Statistics */}
                      <div className={`space-y-1 ${isMobile ? 'text-xs' : 'text-sm'} opacity-90`}>
                        <div className="flex justify-between">
                          <span>Total Spent:</span>
                          <span className="font-medium" data-testid={`text-category-spent-${category.id}`}>
                            {formatCurrency(category.totalSpent)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transactions:</span>
                          <span className="font-medium" data-testid={`text-category-transactions-${category.id}`}>
                            {category.transactionCount}
                          </span>
                        </div>
                      </div>

                      {category.allocatedFunds && parseFloat(category.allocatedFunds) > 0 && (
                        <div className={`space-y-1 ${isMobile ? 'text-xs' : 'text-sm'} opacity-90 border-t border-black/10 dark:border-white/10 pt-2 mt-2`}>
                          {category.allocatedFunds && parseFloat(category.allocatedFunds) > 0 && (
                            <div className="flex justify-between">
                              <span>Available Fund:</span>
                              <span className="font-medium" data-testid={`text-category-allocated-${category.id}`}>
                                {formatCurrency(parseFloat(category.allocatedFunds))}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg md:text-xl font-semibold">Recent Expenses</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              data-testid="button-view-all-expenses"
            >
              <Link href="/analytics">View All</Link>
            </Button>
          </div>
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
                  <p className="text-sm">Start tracking by adding expenses to categories</p>
                </div>
              </div>
            </div>
          ) : (
            <ExpenseList
              expenses={expenses.slice(0, 5)}
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
            <DialogTitle>Add Expense to {selectedCategory}</DialogTitle>
            <DialogDescription>
              Record a new expense for this category.
            </DialogDescription>
          </DialogHeader>
          <ExpenseForm
            onSubmit={handleCreateExpense}
            initialData={{ category: selectedCategory }}
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
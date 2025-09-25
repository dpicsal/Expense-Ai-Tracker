import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useExpenses } from "@/hooks/use-expenses";
import { useCategories } from "@/hooks/use-categories";
import { CategoryForm } from "@/components/category-form";
import { Plus } from "lucide-react";

export default function Categories() {
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const categoryStats = categories.map(category => {
    const categoryExpenses = expenses.filter(e => e.category === category.name);
    const total = categoryExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const count = categoryExpenses.length;
    return { 
      category: category.name, 
      color: category.color,
      icon: category.icon,
      budget: category.budget ? parseFloat(category.budget) : 0,
      allocatedFunds: category.allocatedFunds ? parseFloat(category.allocatedFunds) : 0,
      total, 
      count 
    };
  });

  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Categories
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your expense categories and analyze spending patterns
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-category">
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new category to organize your expenses. Set a name, color, and budget for better expense tracking.
              </DialogDescription>
            </DialogHeader>
            <CategoryForm onClose={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {expensesLoading || categoriesLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading categories...
        </div>
      ) : (
        <div className="grid gap-4">
          {categoryStats.map(({ category, color, icon, budget, allocatedFunds, total, count }) => {
            const percentage = totalSpent > 0 ? (total / totalSpent) * 100 : 0;
            
            return (
              <Card key={category} className="hover-elevate border-0 shadow-md bg-gradient-to-r from-card to-card/50 transition-all duration-200" data-testid={`category-card-${category}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge 
                        className={color}
                        data-testid={`category-badge-${category}`}
                      >
                        {category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {count} transaction{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-lg font-semibold tabular-nums" data-testid={`category-total-${category}`}>
                      AED {total.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Percentage of total spending</span>
                      <span className="tabular-nums">{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2"
                      data-testid={`category-progress-${category}`}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {categoryStats.filter(c => c.count === 0).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unused Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categoryStats
                .filter(c => c.count === 0)
                .map(({ category, color }) => (
                  <Badge 
                    key={category} 
                    variant="outline"
                    className={color}
                  >
                    {category}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
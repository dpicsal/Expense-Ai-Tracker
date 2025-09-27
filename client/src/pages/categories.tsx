import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useExpenses } from "@/hooks/use-expenses";
import { useCategories, useResetCategory } from "@/hooks/use-categories";
import { useFundHistory } from "@/hooks/use-fund-history";
import { CategoryForm } from "@/components/category-form";
import { AddFundsForm } from "@/components/add-funds-form";
import { FundHistory } from "@/components/fund-history";
import { ExcelExportButton } from "@/components/excel-export-button";
import { ExcelImportButton } from "@/components/excel-import-button";
import { Plus, DollarSign, ChevronDown, ChevronUp, Wallet, RotateCcw } from "lucide-react";

export default function Categories() {
  const { data: expenses = [], isLoading: expensesLoading } = useExpenses();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: fundHistory = [] } = useFundHistory();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addFundsDialogOpen, setAddFundsDialogOpen] = useState<string | null>(null);
  const [expandedHistories, setExpandedHistories] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const resetCategory = useResetCategory();

  const categoryStats = categories.map(category => {
    const categoryName = category.name.trim();
    const categoryExpenses = expenses.filter(e => e.category.trim() === categoryName);
    const total = categoryExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const count = categoryExpenses.length;
    return { 
      ...category,
      category: categoryName, 
      color: category.color,
      icon: category.icon,
      allocatedFunds: category.allocatedFunds ? parseFloat(category.allocatedFunds) : 0,
      total, 
      count 
    };
  });

  const handleHistoryExpansion = (categoryName: string, open: boolean) => {
    setExpandedHistories(prev => {
      const next = new Set(prev);
      if (open) {
        next.add(categoryName);
      } else {
        next.delete(categoryName);
      }
      return next;
    });
  };

  const handleAddFundsSuccess = () => {
    setAddFundsDialogOpen(null);
  };

  const handleResetCategory = async (categoryId: string, categoryName: string) => {
    try {
      const result = await resetCategory.mutateAsync(categoryId);
      toast({
        title: "Category Reset Complete",
        description: `Reset ${categoryName}: deleted ${result.deletedExpenses} expenses and ${result.deletedFundHistory} fund entries.`,
      });
    } catch (error) {
      console.error("Error resetting category:", error);
      toast({
        title: "Reset Failed", 
        description: error instanceof Error ? error.message : "Failed to reset category data",
        variant: "destructive",
      });
    }
  };

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
        <div className="flex items-center gap-2">
          <ExcelImportButton 
            variant="outline" 
            onImportSuccess={(count) => {
              toast({
                title: "Import Complete",
                description: `Successfully imported ${count} expenses.`,
              });
            }}
          />
          <ExcelExportButton 
            data={{
              expenses,
              categories,
              fundHistory
            }}
            variant="outline"
          />
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
                  Create a new category to organize your expenses. Set a name and color for better expense tracking.
                </DialogDescription>
              </DialogHeader>
              <CategoryForm onClose={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {expensesLoading || categoriesLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading categories...
        </div>
      ) : (
        <div className="grid gap-4">
          {categoryStats.map((categoryData) => {
            const { category, color, icon, allocatedFunds, total, count } = categoryData;
            const percentage = totalSpent > 0 ? (total / totalSpent) * 100 : 0;
            const remaining = allocatedFunds - total;
            const isExpanded = expandedHistories.has(category);
            
            return (
              <Card key={category} className="border-0 shadow-md bg-gradient-to-r from-card to-card/50 transition-all duration-200" data-testid={`category-card-${category}`}>
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
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-semibold tabular-nums" data-testid={`category-total-${category}`}>
                          AED {total.toFixed(2)}
                        </div>
                        {allocatedFunds > 0 && (
                          <div className="text-xs text-muted-foreground" data-testid={`category-remaining-${category}`}>
                            {remaining >= 0 ? `AED ${remaining.toFixed(2)} remaining` : `AED ${Math.abs(remaining).toFixed(2)} overspent`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Fund Information */}
                  {allocatedFunds > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/30">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-primary" />
                          <span className="font-medium">Available Fund</span>
                        </div>
                        <span className="font-semibold tabular-nums" data-testid={`category-allocated-${category}`}>
                          AED {allocatedFunds.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Percentage of total spending</span>
                      <span className="tabular-nums">{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2"
                      data-testid={`category-progress-${category}`}
                    />
                    
                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Dialog open={addFundsDialogOpen === category} onOpenChange={(open) => setAddFundsDialogOpen(open ? category : null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            data-testid={`button-add-funds-${category}`}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Add Funds
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] max-w-md">
                          <DialogHeader>
                            <DialogTitle>Add Funds to {category}</DialogTitle>
                            <DialogDescription>
                              Add funds to increase the allocated budget for this category.
                            </DialogDescription>
                          </DialogHeader>
                          <AddFundsForm 
                            category={categoryData as any}
                            onClose={() => setAddFundsDialogOpen(null)}
                            onSuccess={handleAddFundsSuccess}
                          />
                        </DialogContent>
                      </Dialog>
                      
                      <ExcelExportButton 
                        data={{
                          expenses,
                          categories,
                          fundHistory
                        }}
                        categoryName={category}
                        variant="outline"
                        size="sm"
                      />
                      
                      <Collapsible open={isExpanded} onOpenChange={(open) => handleHistoryExpansion(category, open)}>
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            data-testid={`button-toggle-history-${category}`}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 mr-2" />
                            ) : (
                              <ChevronDown className="h-4 w-4 mr-2" />
                            )}
                            Fund History
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-4">
                          <FundHistory category={categoryData as any} />
                        </CollapsibleContent>
                      </Collapsible>

                      <div className="flex justify-end">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              data-testid={`button-reset-category-${category}`}
                              disabled={resetCategory.isPending}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reset {category} Category</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete all expenses and fund history for the "{category}" category. 
                              The category itself will remain but its allocated funds will be reset to 0.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleResetCategory(categoryData.id, category)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Reset Category
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
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
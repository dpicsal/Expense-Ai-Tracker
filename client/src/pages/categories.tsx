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
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();

  return (
    <div className={isMobile ? 'space-y-6' : 'space-y-8'}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold tracking-tight dark:text-white/95`}>
            Categories
          </h1>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground font-medium`}>
            Manage your expense categories and analyze spending patterns
          </p>
        </div>
        <div className={`flex flex-wrap items-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
          {!isMobile && (
            <>
              <ExcelImportButton 
                variant="outline"
                size="sm"
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
                size="sm"
              />
            </>
          )}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size={isMobile ? "lg" : "default"} className={isMobile ? 'min-h-11' : ''} data-testid="button-add-category">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className={isMobile ? 'w-[95vw] max-w-md' : 'sm:max-w-md'}>
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
        <div className={`grid ${isMobile ? 'gap-3' : 'gap-4'}`}>
          {categoryStats.map((categoryData) => {
            const { category, color, icon, allocatedFunds, total, count } = categoryData;
            const percentage = allocatedFunds > 0 ? (total / allocatedFunds) * 100 : 0;
            const remaining = allocatedFunds - total;
            const isExpanded = expandedHistories.has(category);
            
            return (
              <Card key={category} className="border dark:border-white/5 dark:bg-gradient-to-br dark:from-[hsl(220,10%,28%)] dark:to-[hsl(220,12%,22%)] bg-gradient-to-r from-card to-card/50 shadow-lg dark:shadow-xl transition-all duration-300 hover:shadow-2xl dark:hover:border-white/10 overflow-hidden relative" data-testid={`category-card-${category}`}>
                <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-white/[0.02] dark:to-transparent pointer-events-none"></div>
                <CardContent className={`${isMobile ? 'p-4' : 'p-6'} relative z-10`}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <Badge 
                        className={`${color} shadow-sm`}
                        data-testid={`category-badge-${category}`}
                      >
                        {category}
                      </Badge>
                      <span className="text-sm text-muted-foreground font-medium">
                        {count} transaction{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xl font-bold tabular-nums dark:text-white/95" data-testid={`category-total-${category}`}>
                          AED {total.toFixed(2)}
                        </div>
                        {allocatedFunds > 0 && (
                          <div className="text-xs text-muted-foreground font-medium mt-0.5" data-testid={`category-remaining-${category}`}>
                            {remaining >= 0 ? `AED ${remaining.toFixed(2)} remaining` : `AED ${Math.abs(remaining).toFixed(2)} overspent`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Fund Information */}
                  {allocatedFunds > 0 && (
                    <div className="mb-4 p-4 rounded-xl dark:bg-white/[0.03] bg-muted/50 border dark:border-white/5 border-border/30 backdrop-blur-sm">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg dark:bg-primary/10 bg-primary/5">
                            <Wallet className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">Available Fund</span>
                        </div>
                        <span className="font-semibold tabular-nums text-base" data-testid={`category-allocated-${category}`}>
                          AED {allocatedFunds.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground font-medium">Allocated Funds Spent</span>
                      <span className="tabular-nums font-bold dark:text-white/90">{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className="h-2.5 dark:bg-white/5"
                      data-testid={`category-progress-${category}`}
                    />
                    
                    {/* Action Buttons */}
                    <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3 pt-3`}>
                      <Dialog open={addFundsDialogOpen === category} onOpenChange={(open) => setAddFundsDialogOpen(open ? category : null)}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size={isMobile ? "lg" : "sm"}
                            className={isMobile ? 'w-full justify-start min-h-11' : ''}
                            data-testid={`button-add-funds-${category}`}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Add Funds
                          </Button>
                        </DialogTrigger>
                        <DialogContent className={isMobile ? 'w-[95vw] max-w-md' : 'sm:max-w-md'}>
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
                      
                      {!isMobile && (
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
                      )}
                      
                      <Collapsible open={isExpanded} onOpenChange={(open) => handleHistoryExpansion(category, open)}>
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size={isMobile ? "lg" : "sm"}
                            className={isMobile ? 'w-full justify-start min-h-11' : ''}
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

                      <div className={`flex ${isMobile ? 'justify-start' : 'justify-end'}`}>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline"
                              size={isMobile ? "lg" : "sm"}
                              className={isMobile ? 'w-full justify-start min-h-11' : ''}
                              data-testid={`button-reset-category-${category}`}
                              disabled={resetCategory.isPending}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reset Category
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
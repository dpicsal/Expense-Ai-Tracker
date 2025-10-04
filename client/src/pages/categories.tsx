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
    
    // Get total funds added to this category from fund history
    const categoryFunds = fundHistory.filter(f => f.categoryId === category.id);
    const totalFundsAdded = categoryFunds.reduce((sum, f) => sum + parseFloat(f.amount), 0);
    
    return { 
      ...category,
      category: categoryName, 
      color: category.color,
      icon: category.icon,
      allocatedFunds: category.allocatedFunds ? parseFloat(category.allocatedFunds) : 0,
      totalFundsAdded, // Total funds added (for percentage calculation)
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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-2">
        <div className="space-y-2">
          <h1 className={`${isMobile ? 'text-3xl' : 'text-5xl'} font-extrabold tracking-tight dark:text-transparent dark:bg-gradient-to-r dark:from-[hsl(45,90%,70%)] dark:via-[hsl(45,90%,60%)] dark:to-[hsl(45,80%,55%)] dark:bg-clip-text dark:drop-shadow-[0_2px_12px_rgba(217,179,84,0.3)]`}>
            Categories
          </h1>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} dark:text-[hsl(45,20%,75%)] text-muted-foreground font-medium`}>
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
            const { category, color, icon, allocatedFunds, totalFundsAdded, total, count } = categoryData;
            const percentage = totalFundsAdded > 0 ? (total / totalFundsAdded) * 100 : 0;
            const remaining = allocatedFunds;
            const isExpanded = expandedHistories.has(category);
            
            return (
              <Card key={category} className="border dark:border-[hsl(45,50%,50%)]/30 dark:bg-gradient-to-br dark:from-[hsl(240,15%,14%)] dark:to-[hsl(240,18%,11%)] bg-gradient-to-r from-card to-card/50 shadow-xl dark:shadow-2xl transition-all duration-500 hover:shadow-2xl dark:hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),_0_10px_20px_-8px_rgba(217,179,84,0.3)] dark:hover:border-[hsl(45,70%,60%)]/50 overflow-hidden relative backdrop-blur-sm" data-testid={`category-card-${category}`}>
                <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-[hsl(45,90%,55%)]/[0.03] dark:via-transparent dark:to-[hsl(270,60%,45%)]/[0.02] pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-32 h-32 dark:bg-[hsl(45,90%,55%)]/[0.05] blur-3xl rounded-full pointer-events-none"></div>
                <CardContent className={`${isMobile ? 'p-4' : 'p-6'} relative z-10`}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <Badge 
                        className={`${color} shadow-md dark:shadow-[hsl(45,90%,55%)]/20 dark:border-[hsl(45,60%,55%)]/30 backdrop-blur-sm`}
                        data-testid={`category-badge-${category}`}
                      >
                        {category}
                      </Badge>
                      <span className="text-sm dark:text-[hsl(45,20%,70%)] text-muted-foreground font-medium">
                        {count} transaction{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-2xl font-extrabold tabular-nums dark:text-[hsl(45,90%,75%)] dark:drop-shadow-[0_2px_8px_rgba(217,179,84,0.3)]" data-testid={`category-total-${category}`}>
                          AED {total.toFixed(2)}
                        </div>
                        {allocatedFunds > 0 && (
                          <div className="text-xs dark:text-[hsl(45,20%,65%)] text-muted-foreground font-semibold mt-1" data-testid={`category-remaining-${category}`}>
                            {remaining >= 0 ? `AED ${remaining.toFixed(2)} remaining` : `AED ${Math.abs(remaining).toFixed(2)} overspent`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Fund Information */}
                  {totalFundsAdded > 0 && (
                    <div className="mb-4 p-4 rounded-xl dark:bg-gradient-to-r dark:from-[hsl(45,90%,55%)]/[0.08] dark:to-[hsl(270,60%,45%)]/[0.05] bg-muted/50 border dark:border-[hsl(45,60%,55%)]/20 border-border/30 backdrop-blur-sm shadow-lg relative overflow-hidden">
                      <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-white/[0.02] dark:to-transparent pointer-events-none"></div>
                      <div className="flex items-center justify-between text-sm relative z-10">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg dark:bg-[hsl(45,90%,55%)]/20 bg-primary/5 shadow-md">
                            <Wallet className="h-4 w-4 text-primary drop-shadow-sm" />
                          </div>
                          <span className="font-semibold dark:text-[hsl(45,30%,85%)]">Total Allocated</span>
                        </div>
                        <span className="font-bold tabular-nums text-base dark:text-[hsl(45,90%,65%)] drop-shadow-sm" data-testid={`category-allocated-${category}`}>
                          AED {totalFundsAdded.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground font-medium">Allocated Funds Spent</span>
                      <span className="tabular-nums font-bold dark:text-white/90">AED {(totalFundsAdded - total).toFixed(2)}</span>
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
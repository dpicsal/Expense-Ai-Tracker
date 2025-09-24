import { useState } from "react";
import { Plus, Edit, Trash2, Settings as SettingsIcon, Download, FileSpreadsheet, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useCategories, useDeleteCategory } from "@/hooks/use-categories";
import { useAppSettings } from "@/hooks/use-app-settings";
import { CategoryForm } from "@/components/category-form";
import { cn } from "@/lib/utils";
import { type Category } from "@shared/schema";

export default function Settings() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: categories = [], isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();
  const { settings, updateSettings } = useAppSettings();

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleDeleteCategory = async (categoryToDelete: Category) => {
    try {
      await deleteCategory.mutateAsync(categoryToDelete.id);
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      setDeleteDialogOpen(false);
      setDeletingCategory(null);
    } catch (error) {
      // Parse server error message
      const errorMessage = error instanceof Error ? error.message : "Failed to delete category";
      const serverMessage = errorMessage.includes(":") ? errorMessage.split(":").slice(1).join(":").trim() : errorMessage;
      
      toast({
        title: "Error",
        description: serverMessage,
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setDeletingCategory(null);
    }
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setDeletingCategory(null);
    }
  };

  const handleExportExpenses = () => {
    // TODO: Implement Excel export functionality
    toast({
      title: "Export Feature",
      description: "Excel export functionality coming soon!",
    });
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-4xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-base md:text-lg font-normal text-muted-foreground">
          Manage your categories and export your data
        </p>
      </div>

      {/* App Preferences */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl font-semibold">App Preferences</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Control app features and permissions</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-card/50">
              <div className="space-y-1">
                <div className="font-medium text-foreground">Category Management</div>
                <p className="text-sm text-muted-foreground">
                  Allow adding, editing, and deleting expense categories
                </p>
              </div>
              <Switch
                checked={settings.allowCategoryManagement}
                onCheckedChange={(checked) => {
                  updateSettings({ allowCategoryManagement: checked });
                  toast({
                    title: checked ? "Category Management Enabled" : "Category Management Disabled",
                    description: checked 
                      ? "You can now add, edit, and delete categories" 
                      : "Category management has been disabled",
                  });
                }}
                data-testid="switch-category-management"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Category Management */}
      {settings.allowCategoryManagement && (
        <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <SettingsIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl font-semibold">Category Management</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Add, edit, or remove expense categories</p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingCategory(null);
            }}>
              {categories.length > 0 && (
                <DialogTrigger asChild>
                  <Button onClick={handleAddCategory} data-testid="button-add-category">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
              )}
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                  </DialogTitle>
                </DialogHeader>
                <CategoryForm 
                  onClose={() => setIsDialogOpen(false)}
                  initialData={editingCategory || undefined}
                  isEditing={!!editingCategory}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-ios-spinner"></div>
                <div className="animate-pulse-glow">Loading categories...</div>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8" data-testid="text-no-categories">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <SettingsIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No categories found</h3>
              <p className="text-muted-foreground mb-4">Add your first category to get started</p>
              <DialogTrigger asChild>
                <Button onClick={handleAddCategory} data-testid="button-add-category-empty">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
            </div>
          ) : (
            <div className="grid gap-3" data-testid="category-list">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-card/50 hover:bg-card/80 transition-colors"
                  data-testid={`category-item-${category.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Badge className={cn(category.color)} data-testid={`category-badge-${category.id}`}>
                      {category.name}
                    </Badge>
                    <div className="flex flex-col gap-1">
                      {category.budget && parseFloat(category.budget) > 0 && (
                        <span className="text-sm text-muted-foreground">
                          Budget: AED {parseFloat(category.budget).toFixed(2)}
                        </span>
                      )}
                      {category.allocatedFunds && parseFloat(category.allocatedFunds) > 0 && (
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                          Allocated: AED {parseFloat(category.allocatedFunds).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEditCategory(category)}
                      data-testid={`button-edit-category-${category.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog 
                      open={deleteDialogOpen && deletingCategory?.id === category.id}
                      onOpenChange={handleDeleteDialogOpenChange}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setDeletingCategory(category);
                            setDeleteDialogOpen(true);
                          }}
                          data-testid={`button-delete-category-${category.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Category</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the "{category.name}" category? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCategory(category)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      <Separator />

      {/* Export & Reports */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl font-semibold">Reports & Export</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Download your expense data in Excel format</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-gradient-to-r from-blue-50/50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/50">
              <div>
                <h3 className="font-medium text-foreground">Export All Expenses</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Download all your expenses in an Excel spreadsheet with categories and date ranges
                </p>
              </div>
              <Button 
                onClick={handleExportExpenses}
                data-testid="button-export-expenses"
                className="shrink-0"
                disabled
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel (Coming Soon)
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
              <strong>Note:</strong> The exported Excel file will include all your expense data with proper AED formatting, 
              category breakdowns, and monthly summaries for easy analysis.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { format } from "date-fns";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type Expense } from "@shared/schema";

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  "Food & Dining": "bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-orange-200 dark:shadow-orange-900",
  "Transportation": "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-200 dark:shadow-blue-900",
  "Shopping": "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-purple-200 dark:shadow-purple-900",
  "Entertainment": "bg-gradient-to-r from-pink-600 to-pink-700 text-white shadow-pink-200 dark:shadow-pink-900",
  "Bills & Utilities": "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-red-200 dark:shadow-red-900",
  "Healthcare": "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-green-200 dark:shadow-green-900",
  "Travel": "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-cyan-200 dark:shadow-cyan-900",
  "Education": "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-indigo-200 dark:shadow-indigo-900",
  "Other": "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-gray-200 dark:shadow-gray-900",
};

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  const handleEdit = () => {
    console.log('Edit expense:', expense.id);
    onEdit?.(expense);
  };

  const handleDelete = () => {
    console.log('Delete expense:', expense.id);
    onDelete?.(expense.id);
  };

  return (
    <Card className="border-0 shadow-ios-sm bg-card/95 backdrop-blur-md transition-all duration-300 ios-transition" data-testid={`expense-card-${expense.id}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold tabular-nums text-foreground" data-testid={`expense-amount-${expense.id}`}>
                AED {parseFloat(expense.amount).toFixed(2)}
              </span>
              <Badge 
                className={cn("px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium rounded-full shadow-sm border-0", categoryColors[expense.category] || categoryColors["Other"])}
                data-testid={`expense-category-${expense.id}`}
              >
                {expense.category}
              </Badge>
            </div>
            <p className="text-sm sm:text-base text-foreground/80 mb-1.5 sm:mb-2 truncate font-medium" data-testid={`expense-description-${expense.id}`}>
              {expense.description}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium" data-testid={`expense-date-${expense.id}`}>
              {format(new Date(expense.date), "MMM dd, yyyy")}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="ios-transition shrink-0 h-9 w-9 sm:h-10 sm:w-10" data-testid={`button-expense-menu-${expense.id}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl shadow-ios-md border-0 bg-card/95 backdrop-blur-md">
              <DropdownMenuItem onClick={handleEdit} className="rounded-lg" data-testid={`button-edit-${expense.id}`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete} 
                className="text-destructive focus:text-destructive rounded-lg"
                data-testid={`button-delete-${expense.id}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
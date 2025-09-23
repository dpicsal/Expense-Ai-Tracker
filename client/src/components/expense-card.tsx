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
    <Card className="hover-elevate ios-scale-press border-0 shadow-lg bg-card transition-all duration-300" data-testid={`expense-card-${expense.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl font-bold tabular-nums text-foreground" data-testid={`expense-amount-${expense.id}`}>
                ${parseFloat(expense.amount).toFixed(2)}
              </span>
              <Badge 
                className={cn("px-3 py-1 text-xs font-medium rounded-full shadow-sm", categoryColors[expense.category] || categoryColors["Other"])}
                data-testid={`expense-category-${expense.id}`}
              >
                {expense.category}
              </Badge>
            </div>
            <p className="text-base text-foreground/80 mb-2 truncate font-medium" data-testid={`expense-description-${expense.id}`}>
              {expense.description}
            </p>
            <p className="text-sm text-muted-foreground font-medium" data-testid={`expense-date-${expense.id}`}>
              {format(new Date(expense.date), "MMM dd, yyyy")}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="ios-transition" data-testid={`button-expense-menu-${expense.id}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit} data-testid={`button-edit-${expense.id}`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete} 
                className="text-destructive focus:text-destructive"
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
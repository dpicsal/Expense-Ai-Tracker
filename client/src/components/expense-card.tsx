import { format } from "date-fns";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { type Expense } from "@shared/schema";

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  "Food & Dining": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "Transportation": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "Shopping": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "Entertainment": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  "Bills & Utilities": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "Healthcare": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Travel": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  "Education": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  "Other": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
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
    <Card className="hover-elevate border-0 shadow-sm bg-gradient-to-r from-card to-card/50 transition-all duration-200" data-testid={`expense-card-${expense.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-semibold tabular-nums" data-testid={`expense-amount-${expense.id}`}>
                ${parseFloat(expense.amount).toFixed(2)}
              </span>
              <Badge 
                className={categoryColors[expense.category] || categoryColors["Other"]}
                data-testid={`expense-category-${expense.id}`}
              >
                {expense.category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1 truncate" data-testid={`expense-description-${expense.id}`}>
              {expense.description}
            </p>
            <p className="text-xs text-muted-foreground" data-testid={`expense-date-${expense.id}`}>
              {format(new Date(expense.date), "MMM dd, yyyy")}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" data-testid={`button-expense-menu-${expense.id}`}>
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
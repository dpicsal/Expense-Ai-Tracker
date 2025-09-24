import { format } from "date-fns";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { type Expense } from "@shared/schema";
import { CATEGORY_GRADIENT_COLORS, PAYMENT_METHOD_LABELS } from "@shared/constants";

interface ExpenseCardProps {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
}

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
                className={cn("px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium rounded-full shadow-sm border-0", CATEGORY_GRADIENT_COLORS[expense.category] || CATEGORY_GRADIENT_COLORS["Other"])}
                data-testid={`expense-category-${expense.id}`}
              >
                {expense.category}
              </Badge>
            </div>
            <p className="text-sm sm:text-base text-foreground/80 mb-1.5 sm:mb-2 truncate font-medium" data-testid={`expense-description-${expense.id}`}>
              {expense.description}
            </p>
            <div className="flex items-center gap-3">
              <p className="text-xs sm:text-sm text-muted-foreground font-medium" data-testid={`expense-date-${expense.id}`}>
                {format(new Date(expense.date), "MMM dd, yyyy")}
              </p>
              {expense.paymentMethod && (
                <Badge 
                  variant="outline" 
                  className="text-xs px-2 py-0.5"
                  data-testid={`expense-payment-method-${expense.id}`}
                >
                  {PAYMENT_METHOD_LABELS[expense.paymentMethod] || expense.paymentMethod}
                </Badge>
              )}
            </div>
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
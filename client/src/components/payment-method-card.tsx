import { useState } from "react";
import { Edit, Trash2, CreditCard, Banknote, Building, Smartphone, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeletePaymentMethod } from "@/hooks/use-payment-methods";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import type { PaymentMethod } from "@shared/schema";

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onEdit: (paymentMethod: PaymentMethod) => void;
}

const iconMap = {
  cash: Banknote,
  credit_card: CreditCard,
  debit_card: CreditCard,
  bank_transfer: Building,
  digital_wallet: Smartphone,
} as const;

const typeLabels = {
  cash: "Cash",
  credit_card: "Credit Card",
  debit_card: "Debit Card", 
  bank_transfer: "Bank Transfer",
  digital_wallet: "Digital Wallet",
} as const;

export function PaymentMethodCard({ paymentMethod, onEdit }: PaymentMethodCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deletePaymentMethod = useDeletePaymentMethod();
  const { toast } = useToast();

  const Icon = iconMap[paymentMethod.type as keyof typeof iconMap] || CreditCard;
  const typeLabel = typeLabels[paymentMethod.type as keyof typeof typeLabels] || paymentMethod.type;

  const handleDelete = async () => {
    try {
      await deletePaymentMethod.mutateAsync(paymentMethod.id);
      toast({
        title: "Payment method deleted",
        description: `${paymentMethod.name} has been successfully deleted.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete payment method. Please try again.",
        variant: "destructive",
      });
    }
    setShowDeleteDialog(false);
  };

  const getBalanceColor = () => {
    const balance = parseFloat(paymentMethod.balance || "0");
    if (paymentMethod.type === "credit_card" && paymentMethod.creditLimit) {
      const utilization = balance / parseFloat(paymentMethod.creditLimit);
      if (utilization > 0.8) return "text-red-600 dark:text-red-400";
      if (utilization > 0.5) return "text-yellow-600 dark:text-yellow-400";
    }
    return balance < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400";
  };

  const getProgressValue = () => {
    const balance = parseFloat(paymentMethod.balance || "0");
    
    if (paymentMethod.type === "credit_card" && paymentMethod.creditLimit) {
      // For credit cards, show available credit (credit limit - balance used)
      const creditLimit = parseFloat(paymentMethod.creditLimit);
      const availableCredit = creditLimit - balance;
      return Math.max((availableCredit / creditLimit) * 100, 0);
    } else {
      // For debit cards and cash, show current balance relative to max balance ever had
      const maxBalance = parseFloat(paymentMethod.maxBalance || paymentMethod.balance || "0");
      if (maxBalance <= 0) return 100; // If no max balance, show full
      return Math.min((balance / maxBalance) * 100, 100);
    }
  };

  const getProgressColor = () => {
    const balance = parseFloat(paymentMethod.balance || "0");
    
    if (paymentMethod.type === "credit_card" && paymentMethod.creditLimit) {
      // For credit cards, low available credit is bad (high utilization)
      const creditLimit = parseFloat(paymentMethod.creditLimit);
      const availableCredit = creditLimit - balance;
      const availablePercentage = (availableCredit / creditLimit) * 100;
      
      if (availablePercentage < 20) return "bg-red-500";   // Less than 20% available credit
      if (availablePercentage < 50) return "bg-yellow-500"; // Less than 50% available credit
      return "bg-green-500"; // Good available credit
    } else {
      // For debit/cash, show green for positive balances, red for low/negative
      if (balance <= 0) return "bg-red-500";
      if (balance < 1000) return "bg-yellow-500";
      return "bg-green-500";
    }
  };

  return (
    <>
      <Card className="hover-elevate transition-all duration-200" data-testid={`card-payment-method-${paymentMethod.id}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground" data-testid={`text-payment-method-name-${paymentMethod.id}`}>
                {paymentMethod.name}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {typeLabel}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid={`button-payment-method-menu-${paymentMethod.id}`}>
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(paymentMethod)} data-testid={`button-edit-payment-method-${paymentMethod.id}`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 dark:text-red-400"
                data-testid={`button-delete-payment-method-${paymentMethod.id}`}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                {paymentMethod.type === "credit_card" ? "Balance" : "Current Balance"}
              </span>
              <span className={`font-semibold ${getBalanceColor()}`} data-testid={`text-payment-method-balance-${paymentMethod.id}`}>
                {formatCurrency(parseFloat(paymentMethod.balance || "0"))}
              </span>
            </div>
            {paymentMethod.creditLimit && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Credit Limit</span>
                <span className="font-medium text-muted-foreground" data-testid={`text-payment-method-limit-${paymentMethod.id}`}>
                  {formatCurrency(parseFloat(paymentMethod.creditLimit))}
                </span>
              </div>
            )}
            
            {/* Progress Bar */}
            <div className="space-y-1" data-testid={`progress-payment-method-${paymentMethod.id}`}>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>
                  {paymentMethod.type === "credit_card" ? "Available Credit" : "Balance Level"}
                </span>
                <span className="font-medium">
                  {getProgressValue().toFixed(0)}%
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={getProgressValue()} 
                  className="h-2"
                />
                <div 
                  className={`absolute inset-0 h-2 rounded-full transition-all ${getProgressColor()}`}
                  style={{ width: `${getProgressValue()}%` }}
                />
              </div>
            </div>

            {!paymentMethod.isActive && (
              <Badge variant="destructive" className="text-xs">
                Inactive
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{paymentMethod.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-payment-method">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
              data-testid="button-confirm-delete-payment-method"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
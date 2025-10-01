import { useState } from "react";
import { Edit, Trash2, CreditCard, Banknote, Building, Smartphone, MoreVertical, Plus, ChevronDown, ChevronUp, History } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useDeletePaymentMethod } from "@/hooks/use-payment-methods";
import { AddFundsToPaymentMethodForm } from "@/components/add-funds-to-payment-method-form";
import { PaymentMethodFundHistory } from "@/components/payment-method-fund-history";
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
} as const;

const typeLabels = {
  cash: "Cash",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
} as const;

export function PaymentMethodCard({ paymentMethod, onEdit }: PaymentMethodCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddFundsDialog, setShowAddFundsDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
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

  const handleAddFundsSuccess = () => {
    setShowAddFundsDialog(false);
  };

  const addFundsLabel = 
    paymentMethod.type === "credit_card" ? "Make Payment" :
    paymentMethod.type === "debit_card" ? "Deposit" : 
    "Add Funds";

  const getBalanceColor = () => {
    const balance = parseFloat(paymentMethod.balance || "0");
    if (paymentMethod.type === "credit_card" && paymentMethod.creditLimit) {
      // For credit cards, balance is available credit, so utilization = (limit - available) / limit
      const creditLimit = parseFloat(paymentMethod.creditLimit);
      const usedAmount = creditLimit - balance;
      const utilization = usedAmount / creditLimit;
      if (utilization > 0.8) return "text-red-600 dark:text-red-400";
      if (utilization > 0.5) return "text-yellow-600 dark:text-yellow-400";
    }
    return balance < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400";
  };

  const getProgressValue = () => {
    const balance = parseFloat(paymentMethod.balance || "0");
    
    if (paymentMethod.type === "credit_card" && paymentMethod.creditLimit) {
      // For credit cards, balance represents available credit
      const creditLimit = parseFloat(paymentMethod.creditLimit);
      return Math.max((balance / creditLimit) * 100, 0);
    } else {
      // For debit cards and cash, show current balance relative to max balance ever had
      const maxBalance = parseFloat(paymentMethod.maxBalance || paymentMethod.balance || "0");
      if (maxBalance <= 0) return 0;
      return Math.min((balance / maxBalance) * 100, 100);
    }
  };

  const getProgressColor = () => {
    const progressValue = getProgressValue();
    
    // Green only when full (100%), red when below 20%
    if (progressValue >= 100) return "bg-green-500";
    if (progressValue < 20) return "bg-red-500";
    return "bg-yellow-500"; // Between 20-99%
  };

  // Render credit card with special design
  const creditCardContent = paymentMethod.type === "credit_card" ? (
    <div 
      className="relative w-full h-48 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-xl shadow-xl hover-elevate transition-all duration-200 overflow-hidden"
      data-testid={`card-payment-method-${paymentMethod.id}`}
    >
      {/* Credit Card Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12"></div>
      
      {/* Header with menu */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" data-testid={`button-payment-method-menu-${paymentMethod.id}`}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowAddFundsDialog(true)} data-testid={`button-add-funds-payment-method-${paymentMethod.id}`}>
              <Plus className="w-4 h-4 mr-2" />
              {addFundsLabel}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowHistory(!showHistory)} data-testid={`button-view-history-payment-method-${paymentMethod.id}`}>
              <History className="w-4 h-4 mr-2" />
              {showHistory ? "Hide History" : "View History"}
            </DropdownMenuItem>
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
      </div>

      {/* Card Content */}
      <div className="p-6 h-full flex flex-col justify-between text-white">
        {/* Top Section */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white" data-testid={`text-payment-method-name-${paymentMethod.id}`}>
              {paymentMethod.name}
            </h3>
            <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0">
              {typeLabel}
            </Badge>
          </div>
        </div>

        {/* Middle Section - Balances */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/70">Available Balance</span>
            <span className={`font-bold text-lg text-white`} data-testid={`text-payment-method-balance-${paymentMethod.id}`}>
              {formatCurrency(parseFloat(paymentMethod.balance || "0"))}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/70">Credit Limit</span>
            <span className="font-medium text-white/90" data-testid={`text-payment-method-limit-${paymentMethod.id}`}>
              {formatCurrency(parseFloat(paymentMethod.creditLimit || "0"))}
            </span>
          </div>
        </div>

        {/* Bottom Section - Progress */}
        <div className="space-y-1" data-testid={`progress-payment-method-${paymentMethod.id}`}>
          <div className="flex justify-between items-center text-xs text-white/70">
            <span>Available Credit</span>
            <span className="font-medium text-white">
              {getProgressValue().toFixed(0)}%
            </span>
          </div>
          <div className="relative w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all rounded-full ${getProgressColor()}`}
              style={{ width: `${getProgressValue()}%` }}
            />
          </div>
        </div>

        {!paymentMethod.isActive && (
          <Badge variant="destructive" className="text-xs absolute top-16 left-6">
            Inactive
          </Badge>
        )}
      </div>
    </div>
  ) : null;

  // Regular card design for non-credit cards
  const regularCardContent = paymentMethod.type !== "credit_card" ? (
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
            <DropdownMenuItem onClick={() => setShowAddFundsDialog(true)} data-testid={`button-add-funds-payment-method-${paymentMethod.id}`}>
              <Plus className="w-4 h-4 mr-2" />
              {addFundsLabel}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowHistory(!showHistory)} data-testid={`button-view-history-payment-method-${paymentMethod.id}`}>
              <History className="w-4 h-4 mr-2" />
              {showHistory ? "Hide History" : "View History"}
            </DropdownMenuItem>
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
            <span className="text-sm text-muted-foreground">Current Balance</span>
            <span className={`font-semibold ${getBalanceColor()}`} data-testid={`text-payment-method-balance-${paymentMethod.id}`}>
              {formatCurrency(parseFloat(paymentMethod.balance || "0"))}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-1" data-testid={`progress-payment-method-${paymentMethod.id}`}>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Balance Level</span>
              <span className="font-medium">
                {getProgressValue().toFixed(0)}%
              </span>
            </div>
            <div className="relative w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all rounded-full ${getProgressColor()}`}
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
  ) : null;

  return (
    <div className="space-y-4">
      {creditCardContent}
      {regularCardContent}

      {showHistory && (
        <PaymentMethodFundHistory paymentMethod={paymentMethod} />
      )}

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

      <Dialog open={showAddFundsDialog} onOpenChange={setShowAddFundsDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>{addFundsLabel} {paymentMethod.type === "credit_card" ? "for" : "to"} {paymentMethod.name}</DialogTitle>
            <DialogDescription>
              {paymentMethod.type === "credit_card" 
                ? "Make a payment to reduce your credit card balance."
                : paymentMethod.type === "debit_card" 
                  ? "Deposit money to increase the balance for this payment method."
                  : "Add funds to increase the balance for this payment method."}
            </DialogDescription>
          </DialogHeader>
          <AddFundsToPaymentMethodForm 
            paymentMethod={paymentMethod}
            onClose={() => setShowAddFundsDialog(false)}
            onSuccess={handleAddFundsSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
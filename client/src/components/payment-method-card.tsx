import { MoreHorizontal, Edit, Trash2, CreditCard, Wallet, Building2, Smartphone, DollarSign, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn, formatCurrency } from "@/lib/utils";
import { type PaymentMethod } from "@shared/schema";

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onEdit?: (paymentMethod: PaymentMethod) => void;
  onDelete?: (id: string) => void;
}

const getPaymentMethodIcon = (type: string) => {
  switch (type) {
    case 'cash':
      return DollarSign;
    case 'credit_card':
    case 'debit_card':
      return CreditCard;
    case 'bank_transfer':
      return Building2;
    case 'digital_wallet':
      return Smartphone;
    default:
      return Wallet;
  }
};

const getPaymentMethodLabel = (type: string) => {
  switch (type) {
    case 'cash':
      return 'Cash';
    case 'credit_card':
      return 'Credit Card';
    case 'debit_card':
      return 'Debit Card';
    case 'bank_transfer':
      return 'Bank Transfer';
    case 'digital_wallet':
      return 'Digital Wallet';
    default:
      return 'Other';
  }
};

const getBalanceStatus = (balance: number, creditLimit?: number | null, type?: string) => {
  if (type === 'credit_card' && creditLimit) {
    const creditUsed = Math.max(0, -balance);
    const utilizationPercent = (creditUsed / creditLimit) * 100;
    
    if (utilizationPercent >= 90) return 'critical';
    if (utilizationPercent >= 75) return 'warning';
    return 'good';
  } else {
    if (balance <= 0) return 'critical';
    if (balance <= 50) return 'warning'; // Low balance warning for non-credit accounts
    return 'good';
  }
};

const getBalanceDisplay = (balance: number, creditLimit?: number | null, type?: string) => {
  if (type === 'credit_card' && creditLimit) {
    const available = Math.max(0, creditLimit + balance);
    return {
      main: formatCurrency(available),
      secondary: `Available`,
      details: `Used: ${formatCurrency(Math.max(0, -balance))} / ${formatCurrency(creditLimit)}`
    };
  } else {
    return {
      main: formatCurrency(balance),
      secondary: balance >= 0 ? 'Balance' : 'Overdraft',
      details: null
    };
  }
};

export function PaymentMethodCard({ paymentMethod, onEdit, onDelete }: PaymentMethodCardProps) {
  const Icon = getPaymentMethodIcon(paymentMethod.type);
  const label = getPaymentMethodLabel(paymentMethod.type);
  const balance = parseFloat(paymentMethod.balance);
  const creditLimit = paymentMethod.creditLimit ? parseFloat(paymentMethod.creditLimit) : null;
  
  const balanceStatus = getBalanceStatus(balance, creditLimit, paymentMethod.type);
  const balanceDisplay = getBalanceDisplay(balance, creditLimit, paymentMethod.type);
  
  const handleEdit = () => {
    onEdit?.(paymentMethod);
  };

  const handleDelete = () => {
    onDelete?.(paymentMethod.id);
  };

  return (
    <Card 
      className={cn(
        "border-0 shadow-ios-sm bg-card/95 backdrop-blur-md transition-all duration-300 ios-transition",
        paymentMethod.color,
        !paymentMethod.isActive && "opacity-60"
      )} 
      data-testid={`payment-method-card-${paymentMethod.id}`}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base sm:text-lg truncate" data-testid={`text-name-${paymentMethod.id}`}>
                  {paymentMethod.name}
                </h3>
                <p className="text-sm text-muted-foreground" data-testid={`text-type-${paymentMethod.id}`}>
                  {label}
                </p>
              </div>
              {balanceStatus !== 'good' && (
                <AlertTriangle 
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    balanceStatus === 'critical' ? "text-red-600" : "text-yellow-600"
                  )} 
                />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div 
                  className={cn(
                    "text-xl sm:text-2xl font-bold",
                    balanceStatus === 'critical' ? "text-red-600" : 
                    balanceStatus === 'warning' ? "text-yellow-600" : "text-green-600"
                  )}
                  data-testid={`text-balance-${paymentMethod.id}`}
                >
                  {balanceDisplay.main}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {balanceDisplay.secondary}
                </div>
              </div>
              
              {balanceDisplay.details && (
                <div className="text-right">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {balanceDisplay.details}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {!paymentMethod.isActive && (
                <Badge variant="secondary" className="text-xs">
                  Inactive
                </Badge>
              )}
              
              {balanceStatus === 'critical' && (
                <Badge variant="destructive" className="text-xs">
                  {paymentMethod.type === 'credit_card' ? 'Near Limit' : 'Low Balance'}
                </Badge>
              )}
              
              {balanceStatus === 'warning' && (
                <Badge variant="secondary" className="text-xs border-yellow-300 text-yellow-800 dark:text-yellow-200">
                  {paymentMethod.type === 'credit_card' ? 'High Usage' : 'Low Balance'}
                </Badge>
              )}
              
              <Badge variant="outline" className="text-xs">
                Updated {format(toZonedTime(new Date(paymentMethod.updatedAt), "Asia/Dubai"), "dd/MM/yyyy")}
              </Badge>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 flex-shrink-0"
                data-testid={`button-menu-${paymentMethod.id}`}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={handleEdit}
                data-testid={`button-edit-${paymentMethod.id}`}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-red-600 dark:text-red-400"
                data-testid={`button-delete-${paymentMethod.id}`}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
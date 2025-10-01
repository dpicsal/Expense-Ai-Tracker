import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Calendar, DollarSign, FileText, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePaymentMethodFundHistoryByPaymentMethod } from "@/hooks/use-payment-method-fund-history";
import { type PaymentMethod } from "@shared/schema";

interface PaymentMethodFundHistoryProps {
  paymentMethod: PaymentMethod;
}

export function PaymentMethodFundHistory({ paymentMethod }: PaymentMethodFundHistoryProps) {
  const { data: fundHistory = [], isLoading, error } = usePaymentMethodFundHistoryByPaymentMethod(paymentMethod.id);
  
  const totalFunds = fundHistory.reduce((sum, history) => sum + parseFloat(history.amount), 0);
  
  const isCreditCard = paymentMethod.type === "credit_card";
  const isDebitCard = paymentMethod.type === "debit_card";
  
  const historyTitle = 
    isCreditCard ? "Payments History" :
    isDebitCard ? "Fund Deposit History" :
    "Fund Addition History";
    
  const itemLabel = 
    isCreditCard ? "payment" :
    isDebitCard ? "deposit" :
    "addition";
    
  const itemsLabel = 
    isCreditCard ? "payments" :
    isDebitCard ? "deposits" :
    "additions";
    
  const totalLabel = 
    isCreditCard ? "Total Payments Made" :
    isDebitCard ? "Total Deposits Made" :
    "Total Funds Added";
    
  const trackingText = 
    isCreditCard ? `Track all payments to ${paymentMethod.name}` :
    isDebitCard ? `Track all deposits to ${paymentMethod.name}` :
    `Track all fund additions to ${paymentMethod.name}`;
    
  const emptyTitle = 
    isCreditCard ? "No payments yet" :
    isDebitCard ? "No deposits yet" :
    "No fund additions yet";
    
  const emptyText = 
    isCreditCard ? "Payments to this credit card will appear here" :
    isDebitCard ? "Deposits to this debit card will appear here" :
    "Fund additions to this payment method will appear here";

  if (isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            {historyTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-ios-spinner"></div>
              <div className="animate-pulse-glow">Loading {isCreditCard ? "payment" : isDebitCard ? "deposit" : "fund"} history...</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            {historyTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-8 w-8" />
              <p>Failed to load {isCreditCard ? "payment" : isDebitCard ? "deposit" : "fund"} history</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            {historyTitle}
          </CardTitle>
          <Badge 
            variant="secondary" 
            className="text-xs"
            data-testid={`fund-history-count-${paymentMethod.name}`}
          >
            {fundHistory.length} {fundHistory.length === 1 ? itemLabel : itemsLabel}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {trackingText}
        </p>
        {fundHistory.length > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{totalLabel}</p>
                <p className="text-2xl font-bold text-primary tabular-nums" data-testid={`total-funds-${paymentMethod.name}`}>
                  AED {totalFunds.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {fundHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 rounded-full bg-muted/50">
                <DollarSign className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium">{emptyTitle}</h3>
                <p className="text-sm">
                  {emptyText}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3" data-testid={`fund-history-list-${paymentMethod.name}`}>
            {fundHistory.map((history) => (
              <div
                key={history.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/30 hover-elevate"
                data-testid={`fund-history-item-${history.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold tabular-nums" data-testid={`fund-amount-${history.id}`}>
                        AED {parseFloat(history.amount).toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span data-testid={`fund-date-${history.id}`}>
                          {format(toZonedTime(new Date(history.addedAt), "Asia/Dubai"), "dd/MM/yyyy 'at' HH:mm")}
                        </span>
                      </div>
                    </div>
                    {history.description && (
                      <p 
                        className="text-sm text-muted-foreground"
                        data-testid={`fund-description-${history.id}`}
                      >
                        {history.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

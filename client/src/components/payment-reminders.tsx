import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { type PaymentMethod } from "@shared/schema";
import { CreditCard, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Link } from "wouter";

interface PaymentReminderData {
  paymentMethod: PaymentMethod;
  daysUntilDue: number;
  nextDueDate: Date;
  urgency: "overdue" | "urgent" | "soon" | "safe";
}

export function PaymentReminders() {
  const { data: paymentMethods = [], isLoading } = usePaymentMethods();

  const calculateDaysUntilDue = (dueDate: number): number => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const currentMonthDueDate = new Date(currentYear, currentMonth, dueDate);
    
    const diffTime = currentMonthDueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getNextDueDate = (dueDate: number): Date => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    return new Date(currentYear, currentMonth, dueDate);
  };

  const getUrgency = (daysUntilDue: number): "overdue" | "urgent" | "soon" | "safe" => {
    if (daysUntilDue < 0) return "overdue";
    if (daysUntilDue <= 3) return "urgent";
    if (daysUntilDue <= 7) return "soon";
    return "safe";
  };

  const creditCards = paymentMethods.filter(
    (method) => method.type === "credit_card" && method.dueDate
  );

  const reminders: PaymentReminderData[] = creditCards.map((method) => {
    const daysUntilDue = calculateDaysUntilDue(method.dueDate!);
    const nextDueDate = getNextDueDate(method.dueDate!);
    const urgency = getUrgency(daysUntilDue);
    
    return {
      paymentMethod: method,
      daysUntilDue,
      nextDueDate,
      urgency,
    };
  }).sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  const urgentReminders = reminders.filter(r => r.urgency === "overdue" || r.urgency === "urgent");

  // Check if any credit cards have a balance that needs to be paid
  const cardsWithBalance = creditCards.filter(card => {
    const balance = parseFloat(card.balance || "0");
    return balance > 0;
  });

  if (isLoading) {
    return (
      <Card data-testid="card-payment-reminders" className="shadow-ios-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Payment Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-12 bg-muted rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  // Only show the component if there are credit cards with balance that need payment
  if (creditCards.length === 0 || cardsWithBalance.length === 0) {
    return null;
  }

  const getUrgencyIcon = (urgency: "overdue" | "urgent" | "soon" | "safe") => {
    switch (urgency) {
      case "overdue":
        return <AlertCircle className="h-4 w-4" />;
      case "urgent":
        return <AlertCircle className="h-4 w-4" />;
      case "soon":
        return <Clock className="h-4 w-4" />;
      case "safe":
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getUrgencyColor = (urgency: "overdue" | "urgent" | "soon" | "safe") => {
    switch (urgency) {
      case "overdue":
        return "destructive";
      case "urgent":
        return "destructive";
      case "soon":
        return "default";
      case "safe":
        return "secondary";
    }
  };

  const getUrgencyText = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return "Overdue";
    if (daysUntilDue === 0) return "Due today";
    if (daysUntilDue === 1) return "Due tomorrow";
    return `Due in ${daysUntilDue} days`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: "numeric" 
    });
  };

  return (
    <Card data-testid="card-payment-reminders" className="shadow-ios-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Payment Reminders</CardTitle>
          {urgentReminders.length > 0 && (
            <Badge variant="destructive" className="h-5" data-testid="badge-urgent-count">
              {urgentReminders.length}
            </Badge>
          )}
        </div>
        <Link href="/payment-methods">
          <Button variant="ghost" size="sm" data-testid="button-view-all">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-2">
        {reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              No upcoming payment reminders
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.slice(0, 5).map((reminder) => {
              const balance = parseFloat(reminder.paymentMethod.balance || "0");
              const hasBalance = balance > 0;

              return (
                <div
                  key={reminder.paymentMethod.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border hover-elevate active-elevate-2 transition-colors"
                  data-testid={`reminder-${reminder.paymentMethod.id}`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-muted/50 flex-shrink-0">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate" data-testid={`text-card-name-${reminder.paymentMethod.id}`}>
                          {reminder.paymentMethod.name}
                        </p>
                        <Badge 
                          variant={getUrgencyColor(reminder.urgency)} 
                          className="flex items-center gap-1 h-5"
                          data-testid={`badge-urgency-${reminder.paymentMethod.id}`}
                        >
                          {getUrgencyIcon(reminder.urgency)}
                          <span className="text-xs">
                            {getUrgencyText(reminder.daysUntilDue)}
                          </span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <p className="text-xs text-muted-foreground">
                          Due: {formatDate(reminder.nextDueDate)}
                        </p>
                        {hasBalance && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <p className="text-xs font-medium" data-testid={`text-balance-${reminder.paymentMethod.id}`}>
                              Balance: {formatCurrency(balance)}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link href="/payment-methods">
                    <Button 
                      variant="outline" 
                      size="sm"
                      data-testid={`button-pay-${reminder.paymentMethod.id}`}
                    >
                      Pay
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

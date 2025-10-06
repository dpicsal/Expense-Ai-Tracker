import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { Link } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function PaymentNotification() {
  const { data: paymentMethods = [] } = usePaymentMethods();

  const calculateDaysUntilDue = (dueDate: number): number => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let dueDateObj = new Date(currentYear, currentMonth, dueDate);
    
    // If the due date has already passed this month, calculate for next month
    if (currentDay > dueDate) {
      dueDateObj = new Date(currentYear, currentMonth + 1, dueDate);
    }
    
    const diffTime = dueDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
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

  const reminders = creditCards
    .filter(method => {
      const availableCredit = parseFloat(method.balance || "0");
      const creditLimit = parseFloat(method.creditLimit || "0");
      const amountOwed = creditLimit - availableCredit;
      return amountOwed > 0;
    })
    .map((method) => {
      const daysUntilDue = calculateDaysUntilDue(method.dueDate!);
      const urgency = getUrgency(daysUntilDue);
      
      return {
        paymentMethod: method,
        daysUntilDue,
        urgency,
      };
    });

  const urgentReminders = reminders.filter(r => r.daysUntilDue <= 7 && r.daysUntilDue >= 0);

  if (urgentReminders.length === 0) {
    return null;
  }

  const tooltipText = urgentReminders.length === 1
    ? "1 payment due within 7 days"
    : `${urgentReminders.length} payments due within 7 days`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href="/payment-methods">
          <Button
            size="icon"
            variant="ghost"
            className="relative"
            data-testid="button-payment-notification"
          >
            <Bell className="h-8 w-8 text-foreground" />
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-destructive items-center justify-center text-[10px] font-bold text-destructive-foreground" data-testid="badge-payment-count">
                {urgentReminders.length}
              </span>
            </span>
            <span className="sr-only">{tooltipText}</span>
          </Button>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}

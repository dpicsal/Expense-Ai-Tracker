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
    
    const currentMonthDueDate = new Date(currentYear, currentMonth, dueDate);
    
    const diffTime = currentMonthDueDate.getTime() - today.getTime();
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

  const urgentReminders = reminders.filter(r => r.urgency === "overdue" || r.urgency === "urgent");

  if (urgentReminders.length === 0) {
    return null;
  }

  const tooltipText = urgentReminders.length === 1
    ? "1 payment needs attention"
    : `${urgentReminders.length} payments need attention`;

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
            <Bell className="h-4 w-4" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              data-testid="badge-payment-count"
            >
              {urgentReminders.length}
            </Badge>
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

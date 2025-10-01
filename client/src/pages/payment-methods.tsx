import { useState } from "react";
import { Plus, Wallet, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentMethodCard } from "@/components/payment-method-card";
import { PaymentMethodForm } from "@/components/payment-method-form";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency } from "@/lib/utils";
import type { PaymentMethod } from "@shared/schema";

export default function PaymentMethodsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const isMobile = useIsMobile();
  
  const { data: paymentMethods = [], isLoading } = usePaymentMethods();

  const handleAddNew = () => {
    setEditingPaymentMethod(null);
    setShowForm(true);
  };

  const handleEdit = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingPaymentMethod(null);
  };

  // Calculate statistics
  const totalBalance = paymentMethods.reduce(
    (sum, method) => sum + parseFloat(method.balance || "0"), 
    0
  );

  const creditCardMethods = paymentMethods.filter(method => method.type === "credit_card");
  const highUtilizationCards = creditCardMethods.filter(method => {
    if (!method.creditLimit) return false;
    const utilization = parseFloat(method.balance || "0") / parseFloat(method.creditLimit);
    return utilization > 0.8;
  });

  const lowBalanceMethods = paymentMethods.filter(method => {
    const balance = parseFloat(method.balance || "0");
    return method.type !== "credit_card" && balance < 100;
  });

  const needsAttention = highUtilizationCards.length + lowBalanceMethods.length;

  if (isLoading) {
    return (
      <div className={isMobile ? 'space-y-4' : 'space-y-6'}>
        <div className="flex items-center justify-between">
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-foreground`}>Payment Methods</h1>
        </div>
        <div className={`grid grid-cols-1 md:grid-cols-3 ${isMobile ? 'gap-3' : 'gap-4'}`}>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={isMobile ? 'space-y-5' : 'space-y-6'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className={`${isMobile ? 'text-2xl' : 'text-2xl'} font-semibold tracking-tight text-foreground`} data-testid="text-payment-methods-title">
            Payment Methods
          </h1>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground`}>
            Manage your payment accounts and track balances
          </p>
        </div>
        <Button onClick={handleAddNew} size={isMobile ? "lg" : "default"} className={isMobile ? 'min-h-11' : ''} data-testid="button-add-payment-method">
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {/* Summary Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-3 ${isMobile ? 'gap-3' : 'gap-4'}`}>
        <Card className={isMobile ? 'min-h-[6.5rem]' : ''}>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'pb-2 px-4 pt-3' : 'pb-2'}`}>
            <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>Total Balance</CardTitle>
            <Wallet className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-muted-foreground`} />
          </CardHeader>
          <CardContent className={isMobile ? 'px-4 pb-3' : ''}>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} data-testid="text-total-balance">
              {formatCurrency(totalBalance)}
            </div>
            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
              Across {paymentMethods.length} accounts
            </p>
          </CardContent>
        </Card>

        <Card className={isMobile ? 'min-h-[6.5rem]' : ''}>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'pb-2 px-4 pt-3' : 'pb-2'}`}>
            <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>Active Methods</CardTitle>
            <TrendingUp className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-muted-foreground`} />
          </CardHeader>
          <CardContent className={isMobile ? 'px-4 pb-3' : ''}>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} data-testid="text-active-methods">
              {paymentMethods.filter(m => m.isActive).length}
            </div>
            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
              Available for expenses
            </p>
          </CardContent>
        </Card>

        <Card className={isMobile ? 'min-h-[6.5rem]' : ''}>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'pb-2 px-4 pt-3' : 'pb-2'}`}>
            <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>Needs Attention</CardTitle>
            <AlertTriangle className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-muted-foreground`} />
          </CardHeader>
          <CardContent className={isMobile ? 'px-4 pb-3' : ''}>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`} data-testid="text-needs-attention">
              {needsAttention}
            </div>
            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
              Low balance or high usage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods List */}
      <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-foreground`}>Your Payment Methods</h2>
        
        {paymentMethods.length === 0 ? (
          <Card className={isMobile ? 'p-6' : 'p-8'}>
            <CardContent className="space-y-4 text-center">
              <Wallet className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} text-muted-foreground mx-auto`} />
              <div>
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-foreground`}>No payment methods yet</h3>
                <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground`}>
                  Add your first payment method to start tracking balances and expenses.
                </p>
              </div>
              <Button onClick={handleAddNew} size={isMobile ? "lg" : "default"} className={isMobile ? 'min-h-11' : ''} data-testid="button-add-first-payment-method">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Payment Method
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${isMobile ? 'gap-3' : 'gap-4'}`}>
            {paymentMethods.map((paymentMethod) => (
              <PaymentMethodCard
                key={paymentMethod.id}
                paymentMethod={paymentMethod}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className={isMobile ? 'w-[95vw] max-w-[425px]' : 'sm:max-w-[425px]'}>
          <DialogHeader>
            <DialogTitle>
              {editingPaymentMethod ? "Edit Payment Method" : "Add Payment Method"}
            </DialogTitle>
          </DialogHeader>
          <PaymentMethodForm
            paymentMethod={editingPaymentMethod || undefined}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
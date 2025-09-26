import { useState } from "react";
import { PlusCircle, Wallet, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { PaymentMethodForm } from "@/components/payment-method-form";
import { PaymentMethodCard } from "@/components/payment-method-card";
import { usePaymentMethods, useCreatePaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod } from "@/hooks/use-payment-methods";
import { type PaymentMethod, type InsertPaymentMethod, type PaymentMethodType } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";

export default function PaymentMethods() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const { data: paymentMethods = [], isLoading } = usePaymentMethods();
  const createPaymentMethod = useCreatePaymentMethod();
  const updatePaymentMethod = useUpdatePaymentMethod();
  const deletePaymentMethod = useDeletePaymentMethod();

  const handleAddPaymentMethod = async (newPaymentMethod: InsertPaymentMethod) => {
    try {
      await createPaymentMethod.mutateAsync(newPaymentMethod);
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Payment method added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add payment method",
        variant: "destructive",
      });
    }
  };

  const handleEditPaymentMethod = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    setIsDialogOpen(true);
  };

  const handleUpdatePaymentMethod = async (updatedPaymentMethod: InsertPaymentMethod) => {
    if (!editingPaymentMethod) return;
    
    try {
      await updatePaymentMethod.mutateAsync({
        id: editingPaymentMethod.id,
        paymentMethod: updatedPaymentMethod,
      });
      setIsDialogOpen(false);
      setEditingPaymentMethod(null);
      toast({
        title: "Success",
        description: "Payment method updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment method",
        variant: "destructive",
      });
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      await deletePaymentMethod.mutateAsync(id);
      toast({
        title: "Success",
        description: "Payment method deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete payment method",
        variant: "destructive",
      });
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPaymentMethod(null);
  };

  // Calculate summary statistics
  const activePaymentMethods = paymentMethods.filter(pm => pm.isActive);
  const totalBalance = paymentMethods.reduce((sum, pm) => sum + parseFloat(pm.balance), 0);
  const lowBalanceMethods = paymentMethods.filter(pm => {
    const balance = parseFloat(pm.balance);
    if (pm.type === 'credit_card' && pm.creditLimit) {
      const creditUsed = Math.max(0, -balance);
      const utilizationPercent = (creditUsed / parseFloat(pm.creditLimit)) * 100;
      return utilizationPercent >= 75;
    } else {
      return balance <= 50;
    }
  }).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading payment methods...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Payment Methods
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Manage your payment methods and track balances
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
          <DialogTrigger asChild>
            <Button
              size={isMobile ? "default" : "lg"}
              className="w-full sm:w-auto"
              data-testid="button-add-payment-method"
              onClick={() => {
                console.log("Add Payment Method button clicked, current state:", isDialogOpen);
                setIsDialogOpen(true);
              }}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPaymentMethod ? "Edit Payment Method" : "Add New Payment Method"}
              </DialogTitle>
              <DialogDescription>
                {editingPaymentMethod 
                  ? "Update the details of your payment method below." 
                  : "Create a new payment method to track your expenses and balances."}
              </DialogDescription>
            </DialogHeader>
            <PaymentMethodForm
              onSubmit={editingPaymentMethod ? handleUpdatePaymentMethod : handleAddPaymentMethod}
              initialData={editingPaymentMethod ? {
                name: editingPaymentMethod.name,
                type: editingPaymentMethod.type as PaymentMethodType,
                balance: parseFloat(editingPaymentMethod.balance),
                creditLimit: editingPaymentMethod.creditLimit ? parseFloat(editingPaymentMethod.creditLimit) : undefined,
                isActive: editingPaymentMethod.isActive,
                color: editingPaymentMethod.color,
              } : undefined}
              isEditing={!!editingPaymentMethod}
              isSubmitting={
                editingPaymentMethod
                  ? updatePaymentMethod.isPending
                  : createPaymentMethod.isPending
              }
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-muted-foreground">Total Methods</span>
          </div>
          <div className="text-2xl font-bold" data-testid="stat-total-methods">
            {paymentMethods.length}
          </div>
          <div className="text-xs text-muted-foreground">
            {activePaymentMethods.length} active
          </div>
        </div>
        
        <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-muted-foreground">Net Balance</span>
          </div>
          <div 
            className={`text-2xl font-bold ${
              totalBalance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
            data-testid="stat-total-balance"
          >
            {formatCurrency(totalBalance)}
          </div>
          <div className="text-xs text-muted-foreground">
            Across all methods
          </div>
        </div>
        
        <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`h-5 w-5 ${lowBalanceMethods > 0 ? 'text-yellow-600' : 'text-green-600'}`} />
            <span className="text-sm font-medium text-muted-foreground">Alerts</span>
          </div>
          <div 
            className={`text-2xl font-bold ${
              lowBalanceMethods > 0 ? 'text-yellow-600' : 'text-green-600'
            }`}
            data-testid="stat-alerts"
          >
            {lowBalanceMethods}
          </div>
          <div className="text-xs text-muted-foreground">
            {lowBalanceMethods > 0 ? 'Need attention' : 'All good'}
          </div>
        </div>
      </div>

      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        <div className="text-center py-12">
          <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No payment methods yet</h3>
          <p className="text-muted-foreground mb-4">
            Add your first payment method to start tracking your finances
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Your First Payment Method
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Payment Method</DialogTitle>
                <DialogDescription>
                  Create your first payment method to start tracking your finances and expenses.
                </DialogDescription>
              </DialogHeader>
              <PaymentMethodForm
                onSubmit={handleAddPaymentMethod}
                isSubmitting={createPaymentMethod.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Your Payment Methods ({paymentMethods.length})
          </h2>
          <div className="grid gap-4">
            {paymentMethods.map((paymentMethod) => (
              <div
                key={paymentMethod.id}
                className="animate-in fade-in-0 slide-in-from-bottom-2"
              >
                <PaymentMethodCard
                  paymentMethod={paymentMethod}
                  onEdit={handleEditPaymentMethod}
                  onDelete={handleDeletePaymentMethod}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
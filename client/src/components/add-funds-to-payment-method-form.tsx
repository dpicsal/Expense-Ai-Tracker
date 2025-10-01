import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAddFundsToPaymentMethod } from "@/hooks/use-payment-method-fund-history";
import { type PaymentMethod, insertPaymentMethodFundHistorySchema } from "@shared/schema";
import { z } from "zod";

const addFundsSchema = insertPaymentMethodFundHistorySchema.omit({
  paymentMethodId: true,
  addedAt: true,
}).extend({
  description: z.string().optional(),
});

type AddFundsFormData = z.infer<typeof addFundsSchema>;

interface AddFundsToPaymentMethodFormProps {
  paymentMethod: PaymentMethod;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddFundsToPaymentMethodForm({ paymentMethod, onClose, onSuccess }: AddFundsToPaymentMethodFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const addFunds = useAddFundsToPaymentMethod();
  const isCreditCard = paymentMethod.type === "credit_card";
  const isDebitCard = paymentMethod.type === "debit_card";
  const actionLabel = 
    isCreditCard ? "Make Payment" :
    isDebitCard ? "Deposit" : 
    "Add Funds";
  const actionVerb = 
    isCreditCard ? "Payment of" :
    isDebitCard ? "Deposited" : 
    "Added";
  const actionVerbPresent = 
    isCreditCard ? "Making Payment" :
    isDebitCard ? "Depositing" : 
    "Adding Funds";

  const form = useForm<AddFundsFormData>({
    resolver: zodResolver(addFundsSchema),
    defaultValues: {
      amount: 0,
      description: "",
    },
  });

  const handleSubmit = async (data: AddFundsFormData) => {
    setIsSubmitting(true);
    try {
      await addFunds.mutateAsync({
        paymentMethodId: paymentMethod.id,
        amount: data.amount,
        description: data.description || undefined,
      });
      
      toast({
        title: "Success",
        description: `${actionVerb} AED ${data.amount.toFixed(2)} to ${paymentMethod.name}`,
      });
      
      form.reset({
        amount: 0,
        description: "",
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add funds";
      const serverMessage = errorMessage.includes(":") ? errorMessage.split(":").slice(1).join(":").trim() : errorMessage;
      
      toast({
        title: "Error",
        description: serverMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">{actionLabel}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">to</span>
              <Badge variant="outline" data-testid={`payment-method-badge-${paymentMethod.name}`}>
                {paymentMethod.name}
              </Badge>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {isCreditCard
            ? "Make a payment to reduce your credit card balance. This will create a history record and update the balance."
            : isDebitCard 
              ? "Deposit money to this payment method. This will create a history record and update the balance."
              : "Add funds to this payment method. This will create a history record and update the balance."}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium">AED</span>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        className="pl-12"
                        inputMode="decimal"
                        data-testid="input-add-funds-payment-method-amount"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., Salary deposit, Cash withdrawal, etc."
                      className="resize-none"
                      rows={3}
                      data-testid="input-add-funds-payment-method-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                data-testid="button-cancel-add-funds-payment-method"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                data-testid="button-submit-add-funds-payment-method"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-ios-spinner"></div>
                    {actionVerbPresent}...
                  </div>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {actionLabel}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

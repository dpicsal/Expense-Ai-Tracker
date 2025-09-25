import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { insertExpenseSchema, type InsertExpense, type PaymentMethodType } from "@shared/schema";
import { DEFAULT_CATEGORIES } from "@shared/constants";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { z } from "zod";

// Custom form type that allows paymentMethod to be a payment method ID (string)
type ExpenseFormData = Omit<InsertExpense, 'paymentMethod'> & {
  paymentMethod: string; // This will be the payment method ID
};

interface ExpenseFormProps {
  onSubmit: (expense: InsertExpense) => void;
  initialData?: Partial<InsertExpense>;
  isEditing?: boolean;
}

export function ExpenseForm({ onSubmit, initialData, isEditing }: ExpenseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();
  const { data: paymentMethods = [], isLoading: isLoadingPaymentMethods } = usePaymentMethods();

  // Helper function to find payment method ID from type (for editing existing expenses)
  const getPaymentMethodIdFromType = (type: PaymentMethodType) => {
    const method = paymentMethods.find(pm => pm.type === type);
    return method?.id || (paymentMethods.length > 0 ? paymentMethods[0].id : "");
  };

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(insertExpenseSchema.omit({ paymentMethod: true }).extend({ paymentMethod: z.string() })),
    defaultValues: {
      amount: initialData?.amount ?? 0,
      description: initialData?.description ?? "",
      category: initialData?.category ?? "",
      paymentMethod: "", // Will be set by useEffect when payment methods load
      date: initialData?.date ?? new Date(),
    },
  });

  // Update payment method when payment methods load or when editing existing expense
  useEffect(() => {
    if (paymentMethods.length > 0) {
      if (isEditing && initialData?.paymentMethod) {
        // When editing, map the legacy payment method type to the corresponding payment method ID
        const paymentMethodId = getPaymentMethodIdFromType(initialData.paymentMethod as PaymentMethodType);
        form.setValue("paymentMethod", paymentMethodId);
      } else if (!form.getValues("paymentMethod")) {
        // When adding new expense, default to first active payment method
        const firstActiveMethod = paymentMethods.find(pm => pm.isActive);
        if (firstActiveMethod) {
          form.setValue("paymentMethod", firstActiveMethod.id);
        }
      }
    }
  }, [paymentMethods, initialData, isEditing, form]);

  const handleSubmit = async (data: ExpenseFormData) => {
    console.log('Form submitted:', data);
    setIsSubmitting(true);
    try {
      // Send the payment method ID directly to the server for balance updates
      // The server will handle converting to type for legacy storage
      const selectedPaymentMethod = paymentMethods.find(pm => pm.id === data.paymentMethod);
      const mappedData: InsertExpense = {
        ...data,
        paymentMethod: data.paymentMethod as InsertExpense['paymentMethod'] // Send ID directly
      };
      await onSubmit(mappedData);
      if (!isEditing) {
        form.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className={isMobile ? "pb-3" : "pb-4"}>
        <CardTitle className={`flex items-center gap-3 ${isMobile ? 'text-lg' : 'text-xl'}`}>
          <div className="p-2 rounded-lg bg-primary/10">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          {isEditing ? 'Edit Expense' : 'Add New Expense'}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          {isEditing ? 'Update your expense details below' : 'Enter your expense information below'}
        </p>
      </CardHeader>
      <CardContent className={isMobile ? "space-y-4" : "space-y-6"}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className={isMobile ? "space-y-4" : "space-y-6"}>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={`text-base font-medium ${isMobile ? 'mb-2' : ''}`}>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium">AED</span>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="pl-12"
                        inputMode="decimal"
                        data-testid="input-amount"
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
                  <FormLabel className={`text-base font-medium ${isMobile ? 'mb-2' : ''}`}>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="What did you spend on?"
                      className={isMobile ? 'min-h-[88px] resize-none' : ''}
                      data-testid="input-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={`text-base font-medium ${isMobile ? 'mb-2' : ''}`}>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DEFAULT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={`text-base font-medium ${isMobile ? 'mb-2' : ''}`}>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-payment-method">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingPaymentMethods ? (
                        <SelectItem value="loading" disabled>
                          Loading payment methods...
                        </SelectItem>
                      ) : paymentMethods.length === 0 ? (
                        <SelectItem value="no-methods" disabled>
                          No payment methods available
                        </SelectItem>
                      ) : (
                        paymentMethods
                          .filter(method => method.isActive)
                          .map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                              {method.name}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className={`text-base font-medium ${isMobile ? 'mb-2' : ''}`}>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          size={isMobile ? "lg" : "default"}
                          className={cn(
                            "w-full pl-3 text-left font-normal justify-start",
                            !field.value && "text-muted-foreground"
                          )}
                          data-testid="button-date-picker"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className={`w-auto p-0 ${isMobile ? 'w-screen max-w-sm' : ''}`} align={isMobile ? "center" : "start"}>
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              size="lg"
              className="w-full text-base font-medium" 
              disabled={isSubmitting}
              data-testid="button-submit-expense"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-ios-spinner"></div>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  {isEditing ? 'Update Expense' : 'Add Expense'}
                </div>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
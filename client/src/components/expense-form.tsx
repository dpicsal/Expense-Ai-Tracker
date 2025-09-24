import { useState } from "react";
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
import { insertExpenseSchema, type InsertExpense, PAYMENT_METHODS } from "@shared/schema";

const categories = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Travel",
  "Education",
  "Other"
];

const paymentMethods = PAYMENT_METHODS.map(method => ({
  value: method,
  label: method === "cash" ? "Cash" :
         method === "credit_card" ? "Credit Card" :
         method === "debit_card" ? "Debit Card" :
         method === "bank_transfer" ? "Bank Transfer" :
         method === "digital_wallet" ? "Digital Wallet" :
         "Other"
}));

interface ExpenseFormProps {
  onSubmit: (expense: InsertExpense) => void;
  initialData?: Partial<InsertExpense>;
  isEditing?: boolean;
}

export function ExpenseForm({ onSubmit, initialData, isEditing }: ExpenseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();

  const form = useForm<InsertExpense>({
    resolver: zodResolver(insertExpenseSchema),
    defaultValues: {
      amount: initialData?.amount,
      description: initialData?.description || "",
      category: initialData?.category || "",
      paymentMethod: initialData?.paymentMethod || "cash",
      date: initialData?.date || new Date(),
    },
  });

  const handleSubmit = async (data: InsertExpense) => {
    console.log('Form submitted:', data);
    setIsSubmitting(true);
    try {
      await onSubmit(data);
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
                      {categories.map((category) => (
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
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
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
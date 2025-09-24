import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, Wallet, Building2, Smartphone, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { insertPaymentMethodSchema, type InsertPaymentMethod, type PaymentMethodType, PAYMENT_METHOD_TYPES } from "@shared/schema";

const paymentMethodOptions = PAYMENT_METHOD_TYPES.map(type => ({
  value: type,
  label: type === "cash" ? "Cash" :
         type === "credit_card" ? "Credit Card" :
         type === "debit_card" ? "Debit Card" :
         type === "bank_transfer" ? "Bank Transfer" :
         type === "digital_wallet" ? "Digital Wallet" :
         "Other",
  icon: type === "cash" ? DollarSign :
        type === "credit_card" ? CreditCard :
        type === "debit_card" ? CreditCard :
        type === "bank_transfer" ? Building2 :
        type === "digital_wallet" ? Smartphone :
        Wallet
}));

const colorOptions = [
  { value: "bg-blue-100", label: "Blue", color: "bg-blue-500" },
  { value: "bg-green-100", label: "Green", color: "bg-green-500" },
  { value: "bg-purple-100", label: "Purple", color: "bg-purple-500" },
  { value: "bg-orange-100", label: "Orange", color: "bg-orange-500" },
  { value: "bg-pink-100", label: "Pink", color: "bg-pink-500" },
  { value: "bg-cyan-100", label: "Cyan", color: "bg-cyan-500" },
  { value: "bg-yellow-100", label: "Yellow", color: "bg-yellow-500" },
  { value: "bg-red-100", label: "Red", color: "bg-red-500" },
  { value: "bg-gray-100", label: "Gray", color: "bg-gray-500" },
];

interface PaymentMethodFormProps {
  onSubmit: (paymentMethod: InsertPaymentMethod) => void;
  initialData?: Partial<InsertPaymentMethod>;
  isEditing?: boolean;
  isSubmitting?: boolean;
}

export function PaymentMethodForm({ onSubmit, initialData, isEditing, isSubmitting }: PaymentMethodFormProps) {
  const [selectedType, setSelectedType] = useState<PaymentMethodType>(initialData?.type || "cash");

  const form = useForm<InsertPaymentMethod>({
    resolver: zodResolver(insertPaymentMethodSchema),
    defaultValues: {
      name: initialData?.name || "",
      type: initialData?.type || "cash",
      balance: initialData?.balance || 0,
      creditLimit: initialData?.creditLimit,
      isActive: initialData?.isActive ?? true,
      color: initialData?.color || "bg-blue-100",
    },
  });

  const handleSubmit = async (data: InsertPaymentMethod) => {
    await onSubmit(data);
    if (!isEditing) {
      form.reset();
    }
  };

  const selectedOption = paymentMethodOptions.find(opt => opt.value === selectedType);
  const SelectedIcon = selectedOption?.icon || Wallet;

  return (
    <Card className="border-0 shadow-ios-sm bg-card/95 backdrop-blur-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
          <SelectedIcon className="h-5 w-5" />
          {isEditing ? "Edit Payment Method" : "Add Payment Method"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Main Credit Card, Cash Wallet"
                      {...field}
                      data-testid="input-payment-method-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type Field */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select 
                    onValueChange={(value: PaymentMethodType) => {
                      field.onChange(value);
                      setSelectedType(value);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-payment-method-type">
                        <SelectValue placeholder="Select payment method type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {paymentMethodOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Balance Field */}
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Balance</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      data-testid="input-payment-method-balance"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Credit Limit Field (conditional) */}
            {selectedType === "credit_card" && (
              <FormField
                control={form.control}
                name="creditLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-payment-method-credit-limit"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Color Field */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color Theme</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-3 gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`p-3 rounded-lg border-2 transition-all ${
                            field.value === color.value 
                              ? 'border-primary shadow-sm' 
                              : 'border-border/50 hover:border-border'
                          }`}
                          onClick={() => field.onChange(color.value)}
                          data-testid={`color-option-${color.label.toLowerCase()}`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${color.color}`} />
                            <span className="text-sm font-medium">{color.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active Status */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Active Status
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Inactive payment methods are hidden from transaction forms
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-payment-method-active"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Preview */}
            <div className="space-y-2">
              <FormLabel>Preview</FormLabel>
              <div className={`p-4 rounded-lg ${form.watch('color')} border transition-all`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SelectedIcon className="h-5 w-5" />
                    <div>
                      <div className="font-medium">{form.watch('name') || 'Payment Method Name'}</div>
                      <div className="text-sm text-muted-foreground">{selectedOption?.label}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${form.watch('balance')?.toFixed(2) || '0.00'}</div>
                    {selectedType === 'credit_card' && form.watch('creditLimit') && (
                      <div className="text-sm text-muted-foreground">
                        Limit: ${form.watch('creditLimit')?.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
                {!form.watch('isActive') && (
                  <Badge variant="secondary" className="mt-2">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
              data-testid="button-submit-payment-method"
            >
              {isSubmitting
                ? (isEditing ? "Updating..." : "Adding...")
                : (isEditing ? "Update Payment Method" : "Add Payment Method")
              }
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
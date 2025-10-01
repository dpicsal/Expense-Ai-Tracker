import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreatePaymentMethod, useUpdatePaymentMethod } from "@/hooks/use-payment-methods";
import { useToast } from "@/hooks/use-toast";
import { insertPaymentMethodSchema, type PaymentMethod } from "@shared/schema";
import { PAYMENT_METHODS } from "@shared/constants";

interface PaymentMethodFormProps {
  paymentMethod?: PaymentMethod;
  onSuccess: () => void;
}

const formSchema = insertPaymentMethodSchema.extend({
  balance: z.union([
    z.string().transform((val) => val === "" ? undefined : parseFloat(val)),
    z.number(),
    z.undefined()
  ]).optional(),
  creditLimit: z.union([
    z.string().transform((val) => val === "" ? undefined : parseFloat(val)),
    z.number(),
    z.undefined()
  ]).optional(),
});

export function PaymentMethodForm({ paymentMethod, onSuccess }: PaymentMethodFormProps) {
  const createPaymentMethod = useCreatePaymentMethod();
  const updatePaymentMethod = useUpdatePaymentMethod();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: paymentMethod?.name || "",
      type: (paymentMethod?.type as any) || "cash",
      balance: paymentMethod?.balance ? parseFloat(paymentMethod.balance) : undefined,
      creditLimit: paymentMethod?.creditLimit ? parseFloat(paymentMethod.creditLimit) : undefined,
      dueDate: paymentMethod?.dueDate || undefined,
      isActive: paymentMethod?.isActive ?? true,
    },
  });

  const watchedType = form.watch("type");
  const isCreditCard = watchedType === "credit_card";

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (paymentMethod) {
        await updatePaymentMethod.mutateAsync({
          id: paymentMethod.id,
          data: values,
        });
        toast({
          title: "Payment method updated",
          description: `${values.name} has been successfully updated.`,
        });
      } else {
        await createPaymentMethod.mutateAsync(values);
        toast({
          title: "Payment method created",
          description: `${values.name} has been successfully created.`,
        });
      }
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${paymentMethod ? "update" : "create"} payment method. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const isLoading = createPaymentMethod.isPending || updatePaymentMethod.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Chase Credit Card, My Cash Wallet"
                  {...field}
                  data-testid="input-payment-method-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-payment-method-type">
                    <SelectValue placeholder="Select a payment method type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
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
          name="balance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isCreditCard ? "Current Balance" : "Initial Balance"}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  data-testid="input-payment-method-balance"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isCreditCard && (
          <>
            <FormField
              control={form.control}
              name="creditLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit Limit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      data-testid="input-payment-method-credit-limit"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Due Date (Day of Month)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="e.g., 15"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      data-testid="input-payment-method-due-date"
                    />
                  </FormControl>
                  <div className="text-[0.8rem] text-muted-foreground">
                    Enter the day of the month when payment is due (1-31)
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active</FormLabel>
                <div className="text-[0.8rem] text-muted-foreground">
                  This payment method is available for new expenses
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

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1"
            data-testid="button-save-payment-method"
          >
            {isLoading ? "Saving..." : paymentMethod ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
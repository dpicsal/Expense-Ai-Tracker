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
import { useAddFundsToCategory } from "@/hooks/use-fund-history";
import { type Category, insertFundHistorySchema } from "@shared/schema";
import { z } from "zod";

// Schema for add funds form - use shared schema but omit server-managed fields
const addFundsSchema = insertFundHistorySchema.omit({
  categoryId: true,
  addedAt: true,
}).extend({
  description: z.string().optional(), // Make description truly optional for UI
});

type AddFundsFormData = z.infer<typeof addFundsSchema>;

interface AddFundsFormProps {
  category: Category;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddFundsForm({ category, onClose, onSuccess }: AddFundsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const addFunds = useAddFundsToCategory();

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
        categoryId: category.id,
        amount: data.amount,
        description: data.description || undefined,
      });
      
      toast({
        title: "Success",
        description: `Added AED ${data.amount.toFixed(2)} to ${category.name}`,
      });
      
      // Reset form with proper default values to keep inputs controlled
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
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">Add Funds</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">to</span>
              <Badge className={category.color} data-testid={`category-badge-${category.name}`}>
                {category.name}
              </Badge>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Add funds to this category. This will create a history record and update the allocated funds.
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
                        data-testid="input-add-funds-amount"
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
                      placeholder="e.g., Monthly budget allocation, Bonus funds, etc."
                      className="resize-none"
                      rows={3}
                      data-testid="input-add-funds-description"
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
                data-testid="button-cancel-add-funds"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                data-testid="button-submit-add-funds"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-ios-spinner"></div>
                    Adding Funds...
                  </div>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Funds
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
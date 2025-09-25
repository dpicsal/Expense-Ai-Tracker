import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useCreateCategory, useUpdateCategory } from "@/hooks/use-categories";
import { insertCategorySchema, type InsertCategory, type Category } from "@shared/schema";
import { COLOR_OPTIONS } from "@shared/constants";

interface CategoryFormProps {
  onClose: () => void;
  initialData?: Category;
  isEditing?: boolean;
}

export function CategoryForm({ onClose, initialData, isEditing }: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const form = useForm<InsertCategory>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: initialData?.name ?? "",
      color: initialData?.color ?? COLOR_OPTIONS[0].value,
      budget: initialData?.budget ? parseFloat(initialData.budget) : undefined,
      allocatedFunds: initialData?.allocatedFunds ? parseFloat(initialData.allocatedFunds) : undefined,
      icon: initialData?.icon ?? "Tag",
    },
  });

  const handleSubmit = async (data: InsertCategory) => {
    setIsSubmitting(true);
    try {
      // Convert string values back to numbers/undefined for submission
      const convertToNumber = (value: any): number | undefined => {
        if (value === undefined || value === null || value === "") return undefined;
        if (typeof value === "number") return value;
        if (typeof value === "string") {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? undefined : parsed;
        }
        return undefined;
      };

      const processedData = {
        ...data,
        budget: convertToNumber(data.budget),
        allocatedFunds: convertToNumber(data.allocatedFunds),
      };

      if (isEditing && initialData) {
        await updateCategory.mutateAsync({
          id: initialData.id,
          category: processedData,
        });
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
        onClose();
      } else {
        await createCategory.mutateAsync(processedData);
        toast({
          title: "Success",
          description: "Category created successfully",
        });
        onClose();
      }
    } catch (error) {
      // Parse server error message
      const errorMessage = error instanceof Error ? error.message : "Failed to save category";
      const serverMessage = errorMessage.includes(":") ? errorMessage.split(":").slice(1).join(":").trim() : errorMessage;
      
      toast({
        title: "Error",
        description: serverMessage,
        variant: "destructive",
      });
      
      // Keep dialog open for user to fix errors
      // Don't call onClose() here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">Category Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., Food & Dining"
                  data-testid="input-category-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">Color</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-category-color">
                    <SelectValue placeholder="Select a color" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {COLOR_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${option.value.split(' ')[0]} border border-border/20`} />
                        {option.label}
                      </div>
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
          name="budget"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">Monthly Budget (Optional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium">AED</span>
                  <Input
                    value={field.value === undefined ? "" : field.value.toString()}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Pass undefined for empty strings, otherwise pass the string value
                      // The zod schema will coerce the string to number  
                      field.onChange(value === "" ? undefined : value);
                    }}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-12"
                    data-testid="input-category-budget"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allocatedFunds"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">Allocated Funds (Optional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium">AED</span>
                  <Input
                    value={field.value === undefined ? "" : field.value.toString()}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Pass undefined for empty strings, otherwise pass the string value
                      // The zod schema will coerce the string to number  
                      field.onChange(value === "" ? undefined : value);
                    }}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-12"
                    data-testid="input-category-allocated-funds"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-category">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} data-testid="button-save-category">
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-ios-spinner"></div>
                Saving...
              </div>
            ) : (
              isEditing ? 'Update Category' : 'Add Category'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
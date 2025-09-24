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

interface CategoryFormProps {
  onClose: () => void;
  initialData?: Category;
  isEditing?: boolean;
}

const colorOptions = [
  { value: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", label: "Orange" },
  { value: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", label: "Blue" },
  { value: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200", label: "Purple" },
  { value: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200", label: "Pink" },
  { value: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", label: "Red" },
  { value: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", label: "Green" },
  { value: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200", label: "Cyan" },
  { value: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200", label: "Indigo" },
  { value: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200", label: "Gray" },
];

export function CategoryForm({ onClose, initialData, isEditing }: CategoryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const form = useForm<InsertCategory>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: initialData?.name || "",
      color: initialData?.color || colorOptions[0].value,
      budget: initialData?.budget ? parseFloat(initialData.budget) : undefined,
      icon: initialData?.icon || "Tag",
    },
  });

  const handleSubmit = async (data: InsertCategory) => {
    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        await updateCategory.mutateAsync({
          id: initialData.id,
          category: data,
        });
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
        onClose();
      } else {
        await createCategory.mutateAsync(data);
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
                  {colorOptions.map((option) => (
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
                    {...field}
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
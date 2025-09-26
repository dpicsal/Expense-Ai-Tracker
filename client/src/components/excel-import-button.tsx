import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { importFromExcel } from "@/lib/excel-utils";
import { useCreateExpense } from "@/hooks/use-expenses";
import { type InsertExpense } from "@shared/schema";

interface ExcelImportButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  onImportSuccess?: (count: number) => void;
}

export function ExcelImportButton({ 
  variant = "outline", 
  size = "sm",
  className = "",
  onImportSuccess
}: ExcelImportButtonProps) {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createExpense = useCreateExpense();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const expenses = await importFromExcel(file);
      
      if (expenses.length === 0) {
        toast({
          title: "No Data Found",
          description: "No valid expense data found in the Excel file.",
          variant: "destructive",
        });
        return;
      }

      // Import each expense
      let successCount = 0;
      let errorCount = 0;

      for (const expense of expenses) {
        try {
          const insertExpense: InsertExpense = {
            amount: parseFloat(expense.amount),
            description: expense.description,
            category: expense.category,
            paymentMethod: expense.paymentMethod as any,
            date: expense.date,
          };

          await createExpense.mutateAsync(insertExpense);
          successCount++;
        } catch (error) {
          console.error("Error importing expense:", error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${successCount} expense${successCount !== 1 ? 's' : ''}${errorCount > 0 ? `. ${errorCount} failed to import.` : '.'}`,
        });
        onImportSuccess?.(successCount);
      } else {
        toast({
          title: "Import Failed",
          description: "Failed to import any expenses from the Excel file.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("Error importing from Excel:", error);
      toast({
        title: "Import Failed",
        description: "Failed to process the Excel file. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
      />
      <Button 
        variant={variant} 
        size={size} 
        onClick={handleButtonClick}
        disabled={isImporting}
        className={className}
        data-testid="button-import-excel"
      >
        <Upload className="w-4 h-4 mr-2" />
        {isImporting ? "Importing..." : "Import from Excel"}
      </Button>
    </>
  );
}
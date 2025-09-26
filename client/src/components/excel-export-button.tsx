import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, type ExcelExportData } from "@/lib/excel-utils";

interface ExcelExportButtonProps {
  data: ExcelExportData;
  categoryName?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function ExcelExportButton({ 
  data, 
  categoryName, 
  variant = "outline", 
  size = "sm",
  className = ""
}: ExcelExportButtonProps) {
  const { toast } = useToast();

  const handleExport = async () => {
    try {
      await exportToExcel(data, categoryName);
      toast({
        title: "Export Successful",
        description: `Excel file has been downloaded successfully.`,
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export data to Excel. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleExport}
      className={className}
      data-testid={`button-export-excel${categoryName ? `-${categoryName}` : ''}`}
    >
      <Download className="w-4 h-4 mr-2" />
      Export to Excel
    </Button>
  );
}
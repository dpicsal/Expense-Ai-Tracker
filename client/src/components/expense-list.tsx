import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExpenseCard } from "./expense-card";
import { type Expense } from "@shared/schema";
import { useCategories } from "@/hooks/use-categories";

interface ExpenseListProps {
  expenses: Expense[];
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
  showFilters?: boolean;
  maxItems?: number;
}


export function ExpenseList({ expenses, onEdit, onDelete, showFilters = true, maxItems }: ExpenseListProps) {
  const { data: categories = [] } = useCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  // Create filter options with "All Categories" plus dynamic categories
  const categoryOptions = ["All Categories", ...categories.map(cat => cat.name.trim())];

  let filteredExpenses = showFilters 
    ? expenses.filter(expense => {
        const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             expense.category.trim().toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "All Categories" || expense.category.trim() === selectedCategory.trim();
        return matchesSearch && matchesCategory;
      })
    : expenses;
  
  // Apply maxItems limit only if no filters are active
  if (maxItems && selectedCategory === "All Categories" && searchTerm === "") {
    filteredExpenses = filteredExpenses.slice(0, maxItems);
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleCategoryFilter = (value: string) => {
    setSelectedCategory(value);
  };

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      {showFilters && (
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-expenses"
          />
        </div>
        <Select value={selectedCategory} onValueChange={handleCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-category">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      )}

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12" data-testid="text-no-expenses">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No expenses found</h3>
          <p className="text-muted-foreground">
            {showFilters 
              ? "Try adjusting your search or filters to find what you're looking for."
              : "No expenses to display."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3" data-testid="expense-list">
          {filteredExpenses.map((expense, index) => (
            <div 
              key={expense.id}
              className="animate-in fade-in-0 slide-in-from-bottom-2"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ExpenseCard
                expense={expense}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
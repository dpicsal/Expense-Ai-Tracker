import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExpenseCard } from "./expense-card";
import { type Expense } from "@shared/schema";

interface ExpenseListProps {
  expenses: Expense[];
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
}

const categories = [
  "All Categories",
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

export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || expense.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSearch = (value: string) => {
    console.log('Search:', value);
    setSearchTerm(value);
  };

  const handleCategoryFilter = (value: string) => {
    console.log('Filter by category:', value);
    setSelectedCategory(value);
  };

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
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
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <span className="text-sm text-muted-foreground">
          {filteredExpenses.length} expenses found
        </span>
        <span className="text-lg font-semibold tabular-nums" data-testid="text-total-amount">
          Total: ${totalAmount.toFixed(2)}
        </span>
      </div>

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground" data-testid="text-no-expenses">
          No expenses found. Try adjusting your search or filters.
        </div>
      ) : (
        <div className="grid gap-4" data-testid="expense-list">
          {filteredExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
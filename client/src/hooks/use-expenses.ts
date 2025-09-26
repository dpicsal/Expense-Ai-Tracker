import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, parseErrorMessage } from "@/lib/queryClient";
import { type Expense, type InsertExpense } from "@shared/schema";

export function useExpenses() {
  return useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (expense: InsertExpense) => {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expense),
      });
      if (!response.ok) {
        const errorMessage = await parseErrorMessage(response, "Failed to create expense");
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, expense }: { id: string; expense: Partial<InsertExpense> }) => {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expense),
      });
      if (!response.ok) {
        const errorMessage = await parseErrorMessage(response, "Failed to update expense");
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorMessage = await parseErrorMessage(response, "Failed to delete expense");
        throw new Error(errorMessage);
      }
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
    },
  });
}
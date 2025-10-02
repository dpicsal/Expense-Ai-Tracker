import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Expense, type InsertExpense } from "@shared/schema";

export function useExpenses(startDate?: Date, endDate?: Date) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate.toISOString());
  if (endDate) params.append('endDate', endDate.toISOString());
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  
  return useQuery<Expense[]>({
    queryKey: ["/api/expenses", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const response = await fetch(`/api/expenses${queryString}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch expenses: ${response.statusText}`);
      }
      return response.json();
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (expense: InsertExpense): Promise<Expense> => {
      const response = await apiRequest("POST", "/api/expenses", expense);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, expense }: { id: string; expense: Partial<InsertExpense> }): Promise<Expense> => {
      const response = await apiRequest("PUT", `/api/expenses/${id}`, expense);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
  });
}
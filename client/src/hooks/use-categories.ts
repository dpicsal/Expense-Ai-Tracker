import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Category, type InsertCategory } from "@shared/schema";

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: InsertCategory): Promise<Category> => {
      const response = await apiRequest("POST", "/api/categories", category);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, category }: { id: string; category: Partial<InsertCategory> }): Promise<Category> => {
      const response = await apiRequest("PUT", `/api/categories/${id}`, category);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      await apiRequest("DELETE", `/api/categories/${id}`);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
  });
}

export function useResetCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<any> => {
      const response = await apiRequest("POST", `/api/categories/${id}/reset`);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all relevant data that may have been reset
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
    },
  });
}

export function useResetAllData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (includeCategories: boolean = false): Promise<any> => {
      const response = await apiRequest("POST", "/api/reset", { includeCategories });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all data since everything was reset
      queryClient.invalidateQueries();
    },
  });
}
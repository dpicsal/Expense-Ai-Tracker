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
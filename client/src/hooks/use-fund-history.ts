import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type FundHistory, type InsertFundHistory } from "@shared/schema";

export function useFundHistory() {
  return useQuery<FundHistory[]>({
    queryKey: ["/api/fund-history"],
  });
}

export function useFundHistoryByCategory(categoryId: string) {
  return useQuery<FundHistory[]>({
    queryKey: ["/api/categories", categoryId, "fund-history"],
    enabled: !!categoryId,
  });
}

export function useCreateFundHistory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fundHistory: InsertFundHistory): Promise<FundHistory> => {
      const response = await apiRequest("POST", "/api/fund-history", fundHistory);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fund-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
  });
}

export function useAddFundsToCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      categoryId, 
      amount, 
      description 
    }: { 
      categoryId: string; 
      amount: number; 
      description?: string;
    }): Promise<{fundHistory: FundHistory, updatedCategory: any}> => {
      const response = await apiRequest("POST", `/api/categories/${categoryId}/add-funds`, {
        amount,
        description,
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate multiple cache keys to refresh all related data
      queryClient.invalidateQueries({ queryKey: ["/api/fund-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories", variables.categoryId, "fund-history"] });
    },
  });
}

export function useUpdateFundHistory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, fundHistory }: { id: string; fundHistory: Partial<InsertFundHistory> }): Promise<FundHistory> => {
      const response = await apiRequest("PUT", `/api/fund-history/${id}`, fundHistory);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fund-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
  });
}

export function useDeleteFundHistory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      await apiRequest("DELETE", `/api/fund-history/${id}`);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fund-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
  });
}
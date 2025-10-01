import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type PaymentMethodFundHistory, type InsertPaymentMethodFundHistory } from "@shared/schema";

export function usePaymentMethodFundHistory() {
  return useQuery<PaymentMethodFundHistory[]>({
    queryKey: ["/api/payment-method-fund-history"],
  });
}

export function usePaymentMethodFundHistoryByPaymentMethod(paymentMethodId: string) {
  return useQuery<PaymentMethodFundHistory[]>({
    queryKey: ["/api/payment-methods", paymentMethodId, "fund-history"],
    enabled: !!paymentMethodId,
  });
}

export function useCreatePaymentMethodFundHistory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fundHistory: InsertPaymentMethodFundHistory): Promise<PaymentMethodFundHistory> => {
      const response = await apiRequest("POST", "/api/payment-method-fund-history", fundHistory);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-method-fund-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
    },
  });
}

export function useAddFundsToPaymentMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      paymentMethodId, 
      amount, 
      description 
    }: { 
      paymentMethodId: string; 
      amount: number; 
      description?: string;
    }): Promise<{fundHistory: PaymentMethodFundHistory, updatedPaymentMethod: any}> => {
      const response = await apiRequest("POST", `/api/payment-methods/${paymentMethodId}/add-funds`, {
        amount,
        description,
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate multiple cache keys to refresh all related data
      queryClient.invalidateQueries({ queryKey: ["/api/payment-method-fund-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods", variables.paymentMethodId, "fund-history"] });
    },
  });
}

export function useUpdatePaymentMethodFundHistory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, fundHistory }: { id: string; fundHistory: Partial<InsertPaymentMethodFundHistory> }): Promise<PaymentMethodFundHistory> => {
      const response = await apiRequest("PUT", `/api/payment-method-fund-history/${id}`, fundHistory);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-method-fund-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
    },
  });
}

export function useDeletePaymentMethodFundHistory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      await apiRequest("DELETE", `/api/payment-method-fund-history/${id}`);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-method-fund-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, parseErrorMessage } from "@/lib/queryClient";
import { type PaymentMethod, type InsertPaymentMethod } from "@shared/schema";

export function usePaymentMethods() {
  return useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (paymentMethod: InsertPaymentMethod) => {
      const response = await fetch("/api/payment-methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentMethod),
      });
      if (!response.ok) {
        const errorMessage = await parseErrorMessage(response, "Failed to create payment method");
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
    },
  });
}

export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, paymentMethod }: { id: string; paymentMethod: Partial<InsertPaymentMethod> }) => {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentMethod),
      });
      if (!response.ok) {
        const errorMessage = await parseErrorMessage(response, "Failed to update payment method");
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
    },
  });
}

export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete payment method");
      }
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
    },
  });
}
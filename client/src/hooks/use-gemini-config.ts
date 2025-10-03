import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { GeminiConfig, InsertGeminiConfig } from "@shared/schema";

export function useGeminiConfig() {
  return useQuery<GeminiConfig>({
    queryKey: ["/api/settings/gemini"],
  });
}

export function useUpdateGeminiConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: InsertGeminiConfig) => {
      const response = await apiRequest("PUT", "/api/settings/gemini", config);
      return response.json() as Promise<GeminiConfig>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/gemini"] });
    },
  });
}

export function useDeleteGeminiConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/settings/gemini");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/gemini"] });
    },
  });
}

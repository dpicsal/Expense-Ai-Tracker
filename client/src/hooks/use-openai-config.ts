import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { OpenAIConfig, InsertOpenAIConfig } from "@shared/schema";

export function useOpenAIConfig() {
  return useQuery<OpenAIConfig>({
    queryKey: ["/api/settings/openai"],
  });
}

export function useUpdateOpenAIConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: InsertOpenAIConfig) => {
      const response = await apiRequest("PUT", "/api/settings/openai", config);
      return response.json() as Promise<OpenAIConfig>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/openai"] });
    },
  });
}

export function useDeleteOpenAIConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/settings/openai");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/openai"] });
    },
  });
}

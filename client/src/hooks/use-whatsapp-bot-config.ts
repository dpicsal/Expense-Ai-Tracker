import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { WhatsappBotConfig, InsertWhatsappBotConfig } from "@shared/schema";

export function useWhatsappBotConfig() {
  return useQuery<WhatsappBotConfig>({
    queryKey: ["/api/settings/whatsapp-bot"],
  });
}

export function useWhatsappWebhookUrl() {
  return useQuery<{ webhookUrl: string }>({
    queryKey: ["/api/settings/whatsapp-bot/webhook-url"],
  });
}

export function useUpdateWhatsappBotConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: InsertWhatsappBotConfig) => {
      const response = await apiRequest("PUT", "/api/settings/whatsapp-bot", config);
      return response.json() as Promise<WhatsappBotConfig>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/whatsapp-bot"] });
    },
  });
}

export function useDeleteWhatsappBotConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/settings/whatsapp-bot");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/whatsapp-bot"] });
    },
  });
}

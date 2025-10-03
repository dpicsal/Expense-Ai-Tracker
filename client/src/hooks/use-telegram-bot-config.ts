import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { TelegramBotConfig, InsertTelegramBotConfig } from "@shared/schema";

export function useTelegramBotConfig() {
  return useQuery<TelegramBotConfig>({
    queryKey: ["/api/settings/telegram-bot"],
  });
}

export function useUpdateTelegramBotConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: InsertTelegramBotConfig) => {
      const response = await apiRequest("PUT", "/api/settings/telegram-bot", config);
      return response.json() as Promise<TelegramBotConfig>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/telegram-bot"] });
    },
  });
}

export function useDeleteTelegramBotConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/settings/telegram-bot");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/telegram-bot"] });
    },
  });
}

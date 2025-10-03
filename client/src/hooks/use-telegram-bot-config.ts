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
      return apiRequest<TelegramBotConfig>("/api/settings/telegram-bot", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
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
      return apiRequest("/api/settings/telegram-bot", {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/telegram-bot"] });
    },
  });
}

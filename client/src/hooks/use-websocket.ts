import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useWebSocket() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WebSocket] Connected to server');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[WebSocket] Received:', message);

        switch (message.type) {
          case 'expense:created':
          case 'expense:updated':
          case 'expense:deleted':
            queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
            queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
            queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
            break;

          case 'category:created':
          case 'category:updated':
          case 'category:deleted':
            queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
            queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
            break;

          case 'payment-method:created':
          case 'payment-method:updated':
          case 'payment-method:deleted':
            queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
            queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
            break;

          case 'fund-history:created':
            queryClient.invalidateQueries({ queryKey: ['/api/fund-history'] });
            queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
            queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
            break;

          default:
            break;
        }
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
    };

    ws.onclose = () => {
      console.log('[WebSocket] Disconnected from server');
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [queryClient]);

  return wsRef.current;
}

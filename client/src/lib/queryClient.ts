import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Enhanced error parsing for mutation hooks
export async function parseErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const errorData = await response.json();
    // Extract specific error message from the server response
    if (errorData.error) {
      return errorData.error;
    }
    if (errorData.message) {
      return errorData.message;
    }
    if (errorData.details && Array.isArray(errorData.details)) {
      // Handle Zod validation errors
      return errorData.details.map((detail: any) => detail.message).join(", ");
    }
  } catch (jsonError) {
    // If JSON parsing fails, try to get text content
    try {
      const textContent = await response.text();
      if (textContent) {
        return textContent;
      }
    } catch (textError) {
      // Fall through to fallback
    }
  }
  return fallbackMessage;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

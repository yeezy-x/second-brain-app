import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useAuthStore } from "@/store/auth-store";

function makeClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Server state defaults tuned for a modern SaaS UX.
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, err) => {
          const status = (err as { response?: { status?: number } })?.response?.status;
          // Don't retry client errors. 5xx and network errors retry once.
          if (status && status >= 400 && status < 500) return false;
          return failureCount < 1;
        },
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(makeClient);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // If a query/mutation surfaces a 401 that escaped refresh, drop auth.
  React.useEffect(() => {
    const onError = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const status = detail?.status;
      if (status === 401) clearAuth();
    };
    window.addEventListener("api:unauthorized", onError as EventListener);
    return () => window.removeEventListener("api:unauthorized", onError as EventListener);
  }, [clearAuth]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

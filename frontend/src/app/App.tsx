import * as React from "react";
import { Toaster } from "sonner";
import { AppRouter } from "@/routes";
import { QueryProvider } from "@/app/QueryProvider";
import { ErrorBoundary } from "@/app/ErrorBoundary";
import { useAuthStore } from "@/store/auth-store";

export function App() {
  const initializeAuth = useAuthStore((s) => s.initializeAuth);

  React.useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <ErrorBoundary>
      <QueryProvider>
        <AppRouter />
        <Toaster
          position="bottom-right"
          theme="dark"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast:
                "!bg-bg-elev !border !border-border !text-fg !rounded-lg !shadow-soft",
              description: "!text-muted-fg",
              actionButton:
                "!bg-accent !text-accent-fg !rounded-md !px-2 !py-1 !text-xs !font-medium",
            },
          }}
        />
      </QueryProvider>
    </ErrorBoundary>
  );
}

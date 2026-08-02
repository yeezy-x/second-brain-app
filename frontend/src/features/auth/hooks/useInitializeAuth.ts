import * as React from "react";
import { authApi } from "@/features/auth/api/auth-api";
import { useAuthStore } from "@/store/auth-store";

/**
 * Hydrate auth from HTTP-only cookies via GET /auth/me.
 * Call once on app mount.
 */
export function useInitializeAuth() {
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  React.useEffect(() => {
    if (hasHydrated) return;
    let cancelled = false;

    (async () => {
      try {
        const user = await authApi.me();
        if (!cancelled) setUser(user);
      } catch {
        if (!cancelled) clearAuth();
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, setUser, clearAuth, setHydrated]);
}

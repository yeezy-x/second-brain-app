import * as React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";

/** Pages like /login or /signup that should redirect authed users away. */
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  if (!hasHydrated) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

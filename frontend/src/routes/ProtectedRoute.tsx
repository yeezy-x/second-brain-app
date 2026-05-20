import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const location = useLocation();

  // Wait until token hydration completes before deciding.
  if (!hasHydrated) return null;

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" replace state={{ from: location }} />
    );
  }
  return <>{children}</>;
}

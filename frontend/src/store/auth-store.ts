import { create } from "zustand";
import type { AuthUser } from "@/features/auth/types";

export type AuthSnapshot = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
};

type AuthState = AuthSnapshot & {
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
  setHydrated: (hydrated: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  hasHydrated: false,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: true,
      hasHydrated: true,
    });
  },

  clearAuth: () => {
    set({
      user: null,
      isAuthenticated: false,
      hasHydrated: true,
    });
  },

  setHydrated: (hydrated) => {
    set({ hasHydrated: hydrated });
  },
}));

/** Read auth snapshot synchronously outside React (used by Axios interceptor). */
export function getAuthSnapshot(): AuthSnapshot {
  const s = useAuthStore.getState();
  return {
    user: s.user,
    isAuthenticated: s.isAuthenticated,
    hasHydrated: s.hasHydrated,
  };
}

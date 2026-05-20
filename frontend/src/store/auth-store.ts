import { create } from "zustand";
import { tokenStorage } from "@/lib/token-storage";

export type AuthSnapshot = {
  accessToken: string | null;
  refreshToken: string | null;
  email: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
};

type AuthState = AuthSnapshot & {
  setTokens: (input: {
    accessToken: string;
    refreshToken: string;
    email?: string;
  }) => void;
  clearAuth: () => void;
  initializeAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  email: null,
  isAuthenticated: false,
  hasHydrated: false,

  setTokens: ({ accessToken, refreshToken, email }) => {
    tokenStorage.set({ accessToken, refreshToken, email });
    set({
      accessToken,
      refreshToken,
      email: email ?? tokenStorage.getEmail() ?? null,
      isAuthenticated: true,
      hasHydrated: true,
    });
  },

  clearAuth: () => {
    tokenStorage.clear();
    set({
      accessToken: null,
      refreshToken: null,
      email: null,
      isAuthenticated: false,
      hasHydrated: true,
    });
  },

  initializeAuth: () => {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();
    const email = tokenStorage.getEmail();
    set({
      accessToken,
      refreshToken,
      email,
      isAuthenticated: Boolean(accessToken && refreshToken),
      hasHydrated: true,
    });
  },
}));

/** Read auth snapshot synchronously outside React (used by Axios interceptor). */
export function getAuthSnapshot(): AuthSnapshot {
  const s = useAuthStore.getState();
  return {
    accessToken: s.accessToken,
    refreshToken: s.refreshToken,
    email: s.email,
    isAuthenticated: s.isAuthenticated,
    hasHydrated: s.hasHydrated,
  };
}

/**
 * Auth token storage. localStorage is used as required. The keys are
 * centralized so we never typo them across the codebase.
 */
const ACCESS_KEY = "sb.access_token";
const REFRESH_KEY = "sb.refresh_token";
const EMAIL_KEY = "sb.user_email";

export const tokenStorage = {
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_KEY);
    } catch {
      return null;
    }
  },
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  },
  getEmail(): string | null {
    try {
      return localStorage.getItem(EMAIL_KEY);
    } catch {
      return null;
    }
  },
  set(tokens: { accessToken: string; refreshToken: string; email?: string }): void {
    try {
      localStorage.setItem(ACCESS_KEY, tokens.accessToken);
      localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
      if (tokens.email !== undefined) localStorage.setItem(EMAIL_KEY, tokens.email);
    } catch {
      /* ignore quota/security errors */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(EMAIL_KEY);
    } catch {
      /* ignore */
    }
  },
};

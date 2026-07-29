import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import type { ApiSuccess } from "@/types/api";
import { getAuthSnapshot, useAuthStore } from "@/store/auth-store";
import { tokenStorage } from "@/lib/token-storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

if (!import.meta.env.VITE_API_BASE_URL && import.meta.env.PROD) {
  console.warn("VITE_API_BASE_URL is not set; falling back to '/api/v1'.");
}

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _skipAuthRefresh?: boolean
};

/* ──────────────────────────────────────────────────────────────────────────
 * Concurrent-safe refresh queue
 * ──────────────────────────────────────────────────────────────────────── */
type Resolver = (token: string) => void;
type Rejector = (err: unknown) => void;

let isRefreshing = false;
let pendingQueue: { resolve: Resolver; reject: Rejector }[] = [];

function flushQueue(error: unknown, token: string | null): void {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error || !token) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
}

/* ──────────────────────────────────────────────────────────────────────────
 * Axios instance
 * ──────────────────────────────────────────────────────────────────────── */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// Bearer attachment
apiClient.interceptors.request.use((config) => {
  const access = tokenStorage.getAccessToken();
  if (access && config.headers) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

/**
 * Refresh handler.
 *
 * Backend quirk: `/auth/refresh-token` is mounted behind `authMiddleware`,
 * so it requires BOTH the (still-valid or just-expired) access token in the
 * Authorization header AND `{ refreshToken }` in the body. We honour that
 * exactly.
 */
async function performRefresh(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken();
  const accessToken = tokenStorage.getAccessToken();
  if (!refreshToken || !accessToken) {
    throw new Error("Missing tokens");
  }

  // Use a bare axios call to avoid recursing through interceptors.
  const res = await axios.post<
    ApiSuccess<{ accessToken: string; refreshToken: string }>
  >(
    `${API_BASE_URL}/auth/refresh-token`,
    { refreshToken },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 15_000,
    }
  );

  const data = res.data?.data;
  if (!data?.accessToken || !data?.refreshToken) {
    throw new Error("Invalid refresh response");
  }
  useAuthStore.getState().setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    email: getAuthSnapshot().email ?? undefined,
  });
  return data.accessToken;
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    // Pass through anything that isn't a 401, isn't retriable, or is the
    // refresh endpoint itself (skip flag).
    if (
      !original ||
      status !== 401 ||
      original._retry ||
      original._skipAuthRefresh ||
      original.url?.includes("/auth/refresh-token") ||
      original.url?.includes("/auth/login") ||
      original.url?.includes("/auth/signup")
    ) {
      return Promise.reject(error);
    }

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Another request is refreshing — queue this one until it's done.
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (newToken) => {
            original._retry = true;
            if (original.headers) {
              original.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(apiClient(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const newAccess = await performRefresh();
      flushQueue(null, newAccess);
      if (original.headers) {
        original.headers.Authorization = `Bearer ${newAccess}`;
      }
      return apiClient(original);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      useAuthStore.getState().clearAuth();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/* ──────────────────────────────────────────────────────────────────────────
 * Tiny helpers that unwrap the backend ApiResponse<T> shape.
 * Always use these instead of touching apiClient directly in features.
 * ──────────────────────────────────────────────────────────────────────── */
async function unwrap<T>(p: Promise<{ data: ApiSuccess<T> }>): Promise<T> {
  const res = await p;
  return res.data.data;
}

export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    unwrap<T>(apiClient.get<ApiSuccess<T>>(url, config)),
  post: <T, B = unknown>(
    url: string,
    body?: B,
    config?: AxiosRequestConfig
  ): Promise<T> => unwrap<T>(apiClient.post<ApiSuccess<T>>(url, body, config)),
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    unwrap<T>(apiClient.delete<ApiSuccess<T>>(url, config)),
  patch: <T, B = unknown>(
    url: string,
    body?: B,
    config?: AxiosRequestConfig
  ): Promise<T> => unwrap<T>(apiClient.patch<ApiSuccess<T>>(url, body, config)),
};

import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import type { ApiSuccess } from "@/types/api";
import { useAuthStore } from "@/store/auth-store";
import type { AuthUser } from "@/features/auth/types";

const API_BASE_URL = "/api/v1";

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _skipAuthRefresh?: boolean;
};

/* ──────────────────────────────────────────────────────────────────────────
 * Concurrent-safe refresh queue
 * ──────────────────────────────────────────────────────────────────────── */
type Resolver = () => void;
type Rejector = (err: unknown) => void;

let isRefreshing = false;
let pendingQueue: { resolve: Resolver; reject: Rejector }[] = [];

function flushQueue(error: unknown): void {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  pendingQueue = [];
}

/* ──────────────────────────────────────────────────────────────────────────
 * Axios instance — cookies carry JWTs (withCredentials)
 * ──────────────────────────────────────────────────────────────────────── */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  withCredentials: true,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

/**
 * Refresh handler.
 * Access + refresh JWTs live in HTTP-only cookies; the browser sends them
 * automatically. Refresh only needs credentials — no body token.
 */
async function performRefresh(): Promise<void> {
  const res = await axios.post<ApiSuccess<AuthUser>>(
    `${API_BASE_URL}/auth/refresh-token`,
    {},
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
      timeout: 15_000,
    }
  );

  const user = res.data?.data;
  if (!user?.id) {
    throw new Error("Invalid refresh response");
  }
  useAuthStore.getState().setUser(user);
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (
      !original ||
      status !== 401 ||
      original._retry ||
      original._skipAuthRefresh ||
      original.url?.includes("/auth/refresh-token") ||
      original.url?.includes("/auth/login") ||
      original.url?.includes("/auth/signup") ||
      original.url?.includes("/auth/logout")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: () => {
            original._retry = true;
            resolve(apiClient(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      await performRefresh();
      flushQueue(null);
      return apiClient(original);
    } catch (refreshError) {
      flushQueue(refreshError);
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

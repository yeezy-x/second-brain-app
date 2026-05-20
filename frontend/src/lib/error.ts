import type { NormalizedError } from "@/types/api";
import { AxiosError, isAxiosError } from "axios";

const FALLBACK = "Something went wrong. Please try again.";

function flattenFieldErrors(
  errors: Record<string, string[] | undefined> | undefined
): Record<string, string> | undefined {
  if (!errors) return undefined;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
      out[key] = value[0];
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function normalizeError(err: unknown): NormalizedError {
  if (isAxiosError(err)) {
    const ax = err as AxiosError<{
      message?: string;
      errors?: Record<string, string[] | undefined>;
      requestId?: string;
    }>;

    // No response = network / CORS / DNS / offline
    if (!ax.response) {
      return {
        status: 0,
        message:
          ax.code === "ECONNABORTED"
            ? "The request timed out. Check your connection and try again."
            : "Couldn't reach the server. Check your connection.",
        isNetworkError: true,
        isAuthError: false,
      };
    }

    const status = ax.response.status;
    const body = ax.response.data;

    // Don't echo raw 5xx server messages to users (backend may surface a stack
    // trace or "Internal Server Error" verbatim). Use a generic, friendly tone.
    let message: string;
    if (status >= 500) {
      message = "Something went wrong on our end. Please try again in a moment.";
    } else {
      message =
        (body && typeof body.message === "string" && body.message) ||
        ax.message ||
        FALLBACK;
    }

    return {
      status,
      message,
      fieldErrors: flattenFieldErrors(body?.errors),
      requestId: body?.requestId,
      isNetworkError: false,
      isAuthError: status === 401 || status === 403,
    };
  }

  if (err instanceof Error) {
    return {
      status: 0,
      message: err.message || FALLBACK,
      isNetworkError: false,
      isAuthError: false,
    };
  }

  return {
    status: 0,
    message: FALLBACK,
    isNetworkError: false,
    isAuthError: false,
  };
}

export function getErrorMessage(err: unknown): string {
  return normalizeError(err).message;
}

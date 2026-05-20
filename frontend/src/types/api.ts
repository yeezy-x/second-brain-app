/**
 * Shapes that mirror the backend exactly. The backend returns:
 *  Success: { success: true, data: T, message?: string, meta?: unknown }
 *  Error:   { success: false, message: string, errors?: Record<string, string[]>, requestId?: string, code?: string }
 */
export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
  meta?: unknown;
};

export type ApiErrorBody = {
  success: false;
  message: string;
  errors?: Record<string, string[] | undefined>;
  requestId?: string;
  code?: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;

/**
 * Normalized error type used everywhere in the UI layer.
 * Built from Axios errors, malformed payloads, network failures, etc.
 */
export type NormalizedError = {
  status: number; // 0 = network/unknown
  message: string;
  fieldErrors?: Record<string, string>;
  requestId?: string;
  isNetworkError: boolean;
  isAuthError: boolean;
};

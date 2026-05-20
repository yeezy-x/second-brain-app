import axios from "axios";
import { http } from "@/lib/api-client";
import type { PublicSharedItem, Share } from "@/features/share/types";
import type { ApiSuccess } from "@/types/api";

const PUBLIC_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export const shareApi = {
  /** POST /share — auth. Idempotent: returns the existing active share if one exists. */
  create: (): Promise<Share> => http.post<Share>("/share"),

  /** PATCH /share/:shareId/disable — auth. Disables the share. */
  disable: (shareId: string): Promise<Share> =>
    http.patch<Share>(`/share/${shareId}/disable`),

  /**
   * GET /share/:shareId — PUBLIC. We use a bare axios call so the auth
   * interceptor doesn't attach a Bearer token (which would break public
   * access for unauthenticated viewers).
   */
  getPublic: async (
    shareId: string,
    signal?: AbortSignal
  ): Promise<PublicSharedItem[]> => {
    const res = await axios.get<ApiSuccess<PublicSharedItem[]>>(
      `${PUBLIC_BASE_URL}/share/${shareId}`,
      { signal, timeout: 20_000 }
    );
    return res.data.data;
  },
};

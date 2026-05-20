/**
 * Centralized, stable React Query keys. Always import from here so
 * invalidation is reliable and refactor-safe.
 */
import type { ContentListQuery } from "@/features/content/types";

export const queryKeys = {
  auth: {
    all: ["auth"] as const,
  },
  content: {
    all: ["content"] as const,
    list: (params: ContentListQuery) => ["content", "list", params] as const,
  },
  tags: {
    all: ["tags"] as const,
    list: () => ["tags", "list"] as const,
  },
  share: {
    all: ["share"] as const,
    mine: () => ["share", "mine"] as const,
    public: (shareId: string) => ["share", "public", shareId] as const,
  },
} as const;

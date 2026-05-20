import { useQuery } from "@tanstack/react-query";
import { shareApi } from "@/features/share/api/share-api";
import { queryKeys } from "@/lib/query-keys";

export function usePublicShare(shareId: string | undefined) {
  return useQuery({
    queryKey: shareId ? queryKeys.share.public(shareId) : queryKeys.share.all,
    queryFn: ({ signal }) => {
      if (!shareId) throw new Error("Missing shareId");
      return shareApi.getPublic(shareId, signal);
    },
    enabled: Boolean(shareId),
    staleTime: 60 * 1000,
    retry: (failureCount, err) => {
      const status = (err as { response?: { status?: number } })?.response?.status;
      // Don't retry 4xx (404 share not found, 403 expired) — fail fast.
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 1;
    },
  });
}

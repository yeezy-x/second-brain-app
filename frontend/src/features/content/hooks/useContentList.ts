import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { contentApi } from "@/features/content/api/content-api";
import { queryKeys } from "@/lib/query-keys";
import type { ContentListQuery } from "@/features/content/types";

export function useContentList(params: ContentListQuery) {
  return useQuery({
    queryKey: queryKeys.content.list(params),
    queryFn: ({ signal }) => contentApi.list(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    retry: (failureCount, err) => {
      // Don't retry validation/auth errors. Network/5xx => retry once.
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 1;
    },
  });
}

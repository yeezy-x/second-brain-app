import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { contentApi } from "@/features/content/api/content-api";
import { queryKeys } from "@/lib/query-keys";
import type { ContentItem, ContentListQuery } from "@/features/content/types";

function itemNeedsEnrichment(item: ContentItem): boolean {
  return Boolean(
    item.url &&
      !item.metadata?.ai?.summary &&
      item.metadataStatus !== "failed"
  );
}

export function useContentList(params: ContentListQuery) {
  return useQuery({
    queryKey: queryKeys.content.list(params),
    queryFn: ({ signal }) => contentApi.list(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      return items.some(itemNeedsEnrichment) ? 5000 : false;
    },
    retry: (failureCount, err) => {
      // Don't retry validation/auth errors. Network/5xx => retry once.
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 1;
    },
  });
}

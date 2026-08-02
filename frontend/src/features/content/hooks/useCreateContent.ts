import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contentApi } from "@/features/content/api/content-api";
import { queryKeys } from "@/lib/query-keys";
import type {
  ContentItem,
  ContentListResponse,
  CreateContentRequest,
} from "@/features/content/types";

/**
 * Create content with an optimistic update so the new item shows up at the
 * top of the active list immediately, then reconcile with the server response.
 */
export function useCreateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateContentRequest) => contentApi.create(body),
    onSuccess: (created) => {
      // Patch the most recently used (first page) list caches synchronously.
      const lists = queryClient.getQueriesData<ContentListResponse>({
        queryKey: queryKeys.content.all,
      });
      for (const [key, snap] of lists) {
        if (!snap) continue;
        // Only mutate first-page caches (no cursor) to avoid re-ordering paged caches.
        const params = (key as readonly unknown[])[2] as
          | { cursor?: string }
          | undefined;
        if (params && params.cursor) continue;

        const optimistic: ContentItem = {
          id: created.id || created._id,
          _id: created._id || created.id,
          type: created.type,
          title: created.title,
          url: created.url,
          tags: created.tags ?? [],
          createdAt: created.createdAt ?? new Date().toISOString(),
        };
        queryClient.setQueryData<ContentListResponse>(key, {
          ...snap,
          items: [optimistic, ...snap.items],
        });
      }
      // Then invalidate so the server view becomes the source of truth.
      queryClient.invalidateQueries({
        queryKey: queryKeys.content.all,
        refetchType: "active",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
    },
  });
}

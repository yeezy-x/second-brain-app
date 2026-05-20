import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contentApi } from "@/features/content/api/content-api";
import { queryKeys } from "@/lib/query-keys";
import type { ContentListResponse } from "@/features/content/types";

/**
 * Optimistically remove the item from every active list cache, roll back on
 * failure, then invalidate to reconcile.
 */
export function useDeleteContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contentApi.remove(id),

    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.content.all });

      const snapshots = queryClient.getQueriesData<ContentListResponse>({
        queryKey: queryKeys.content.all,
      });

      for (const [key, snap] of snapshots) {
        if (!snap) continue;
        queryClient.setQueryData<ContentListResponse>(key, {
          ...snap,
          items: snap.items.filter((it) => it._id !== id),
        });
      }

      return { snapshots };
    },

    onError: (_err, _id, ctx) => {
      // Roll back to pre-mutation snapshots
      if (ctx?.snapshots) {
        for (const [key, snap] of ctx.snapshots) {
          queryClient.setQueryData(key, snap);
        }
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.content.all,
        refetchType: "active",
      });
    },
  });
}

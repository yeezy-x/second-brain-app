import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contentApi } from "@/features/content/api/content-api";
import { queryKeys } from "@/lib/query-keys";
import type { ContentListResponse } from "@/features/content/types";

export function useAddContentTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tag }: { id: string; tag: string }) =>
      contentApi.addTag(id, tag),

    onSuccess: (updated, { id }) => {
      const lists = queryClient.getQueriesData<ContentListResponse>({
        queryKey: queryKeys.content.all,
      });

      for (const [key, snap] of lists) {
        if (!snap) continue;
        queryClient.setQueryData<ContentListResponse>(key, {
          ...snap,
          items: snap.items.map((it) =>
            it._id === id || it.id === id ? { ...it, ...updated } : it
          ),
        });
      }

      queryClient.invalidateQueries({
        queryKey: queryKeys.content.all,
        refetchType: "active",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
    },
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contentApi } from "../api/content-api";
import type { ContentListResponse, ContentUpdateRequest } from "../types";      
import { queryKeys } from "@/lib/query-keys";

export function useUpdateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ContentUpdateRequest) => contentApi.updateContent(data.id, data),
    onSuccess: (updated, { id }) => {
      queryClient.setQueryData<ContentListResponse>(queryKeys.content.all, (old) => {
        return old ? {
          ...old,
          items: old.items.map((item) => item._id === id ? updated : item),
          nextCursor: old.nextCursor,
        } : undefined;
      });
    },
  });
}           
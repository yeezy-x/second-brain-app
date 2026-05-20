import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shareApi } from "@/features/share/api/share-api";
import { queryKeys } from "@/lib/query-keys";
import type { Share } from "@/features/share/types";

export function useDisableShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (shareId: string) => shareApi.disable(shareId),
    onSuccess: (share: Share) => {
      queryClient.setQueryData(queryKeys.share.mine(), share);
    },
  });
}

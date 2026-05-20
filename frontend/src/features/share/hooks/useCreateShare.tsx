import { useMutation, useQueryClient } from "@tanstack/react-query";
import { shareApi } from "@/features/share/api/share-api";
import { queryKeys } from "@/lib/query-keys";
import type { Share } from "@/features/share/types";

/**
 * "Get or create" my active share. POST /share is idempotent on the backend,
 * so we model this as a mutation that callers fire when they open the dialog.
 */
export function useCreateShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => shareApi.create(),
    onSuccess: (share: Share) => {
      queryClient.setQueryData(queryKeys.share.mine(), share);
    },
  });
}

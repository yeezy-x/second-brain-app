import { useMutation } from "@tanstack/react-query";
import { aiApi } from "@/features/ai/api/ai-api";
import type { PrefillRequest } from "@/features/ai/types";

export function useAiPrefill() {
  return useMutation({
    mutationFn: ({ url, signal }: PrefillRequest & { signal?: AbortSignal }) =>
      aiApi.prefill({ url }, signal),
  });
}
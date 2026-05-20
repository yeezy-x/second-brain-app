import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { tagsApi } from "@/features/tags/api/tags-api";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/store/auth-store";
import type { Tag } from "@/features/tags/types";

export function useTags() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.tags.list(),
    queryFn: ({ signal }) => tagsApi.list(signal),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

/** Map of tag _id -> name. Useful for resolving the ObjectId refs returned by /content. */
export function useTagNameMap(): Record<string, string> {
  const { data } = useTags();
  return useMemo(() => {
    const map: Record<string, string> = {};
    if (data) for (const t of data as Tag[]) map[t._id] = t.name;
    return map;
  }, [data]);
}

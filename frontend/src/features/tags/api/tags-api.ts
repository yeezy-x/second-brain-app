import { http } from "@/lib/api-client";
import type { Tag } from "@/features/tags/types";

export const tagsApi = {
  list: (signal?: AbortSignal): Promise<Tag[]> =>
    http.get<Tag[]>("/tags", { signal }),
};

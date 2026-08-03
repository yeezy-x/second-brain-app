import { http } from "@/lib/api-client";
import type {
  ContentItem,
  ContentListQuery,
  ContentListResponse,
  CreateContentRequest,
} from "@/features/content/types";

function buildQueryString(params: ContentListQuery): string {
  const usp = new URLSearchParams();
  if (params.type) usp.set("type", params.type);
  if (params.tag) usp.set("tag", params.tag);
  if (params.cursor) usp.set("cursor", params.cursor);
  if (params.limit !== undefined) usp.set("limit", String(params.limit));
  if (params.search) usp.set("search", params.search);
  if (params.mode && params.mode !== "keyword") usp.set("mode", params.mode);
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

export const contentApi = {
  list: (params: ContentListQuery, signal?: AbortSignal): Promise<ContentListResponse> =>
    http.get<ContentListResponse>(`/content${buildQueryString(params)}`, { signal }),

  create: (body: CreateContentRequest): Promise<ContentItem> =>
    http.post<ContentItem, CreateContentRequest>("/content", body),

  addTag: (id: string, tag: string): Promise<ContentItem> =>
    http.post<ContentItem, { tag: string }>(`/content/${id}/tags`, { tag }),

  remove: (id: string): Promise<null> => http.delete<null>(`/content/${id}`),
};

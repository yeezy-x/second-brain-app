/**
 * Content feature types — exact mirror of backend.
 *
 * Source of truth:
 *   - src/modules/content/content.validation.ts
 *   - src/modules/content/content.controller.ts (GET returns { items, nextCursor })
 *   - src/modules/content/content.service.ts (selects _id title type url tags createdAt)
 */
export type ContentType = "tweet" | "video" | "document" | "link";

export const CONTENT_TYPES: ContentType[] = ["tweet", "video", "document", "link"];

export type CreateContentRequest = {
  type: ContentType;
  title: string;
  description?: string;
  url?: string;
  tags?: string[];
};

/** A row as returned by GET /content. `tags` are Mongo ObjectId strings. */
export type ContentItem = {
  _id: string;
  type: ContentType;
  title?: string;
  url?: string;
  tags: string[];
  createdAt: string;
};

export type ContentListResponse = {
  items: ContentItem[];
  nextCursor: string | null;
};

export type ContentListQuery = {
  type?: ContentType;
  tag?: string;
  cursor?: string;
  limit?: number;
  search?: string;
};

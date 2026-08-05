/**
 * Content feature types — mirror of backend Prisma-mapped DTOs.
 */
export type ContentType = "tweet" | "video" | "document" | "link";

export const CONTENT_TYPES: ContentType[] = ["tweet", "video", "document", "link"];

export type ContentTag = {
  id: string;
  name: string;
};

export type CreateContentRequest = {
  type: ContentType;
  title: string;
  description?: string;
  url?: string;
  tags?: string[];
};

/** A row as returned by GET /content. Tags are { id, name } objects. */
export type ContentAiMetadata = {
  summary: string;
  suggestedTags: string[];
  keyPoints: string[];
  enrichedAt: string;
  status?: "done" | "failed";
};

export type ContentMetadata = {
  title?: string;
  description?: string;
  image?: string;
  ai?: ContentAiMetadata;
};

export type SearchMode = "keyword" | "semantic";

export type ContentItem = {
  id: string;
  _id: string;
  type: ContentType;
  title?: string;
  url?: string;
  metadata?: ContentMetadata;
  metadataStatus?: "pending" | "done" | "failed" | "fallback";
  relevanceScore?: number;
  tags: ContentTag[];
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
  mode?: SearchMode;
};

export type ContentUpdateRequest = {
  id: string;
  title?: string;
  description?: string;
  url?: string;
  tags?: string[];
};
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
export type ContentItem = {
  id: string;
  _id: string;
  type: ContentType;
  title?: string;
  url?: string;
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
};

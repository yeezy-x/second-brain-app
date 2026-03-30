export type ContentType = "tweet" | "video" | "document" | "link";
export interface CreateContentDTO {
  type: ContentType;
  title?: string;
  description?: string;
  url?: string;
  tags?: string[];
}
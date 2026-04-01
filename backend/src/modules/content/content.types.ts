export type ContentType = "tweet" | "video" | "document" | "link";
export interface CreateContentDTO {
  type: ContentType;
  title?: string;
  description?: string;
  url?: string;
  tags?: string[];
}

export interface ContentResponseDTO {
  id: string;
  type: ContentType;
  title?: string;
  url?: string;
  description?: string;
  tags: string[];
}

export interface GetContentQuery {
  type?: ContentType;
  tag?: string;
  cursor?: string;
  limit?: number;
  search?: string;
}
export interface ContentService {
  getContentByUserId(userId: string): Promise<ContentResponseDTO[]>;
}
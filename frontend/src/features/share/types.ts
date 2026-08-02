/**
 * Share types — mirror of the backend Share model / public content DTO.
 */
export type Share = {
  id: string;
  _id: string;
  userId: string;
  shareId: string;
  isActive: boolean;
  expiresAt?: string;
  visibility: "public" | "private";
  createdAt?: string;
  updatedAt?: string;
};

export type ContentTag = {
  id: string;
  name: string;
};

/** Public share content row — what GET /share/:shareId returns per item. */
export type PublicSharedItem = {
  id: string;
  _id: string;
  type: "tweet" | "video" | "document" | "link";
  title?: string;
  url?: string;
  description?: string;
  metadata?: {
    title?: string;
    description?: string;
    image?: string;
  };
  tags: ContentTag[];
  createdAt: string;
};

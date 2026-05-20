/**
 * Share types — exact mirror of the backend Share model.
 *
 * Source of truth:
 *   - src/modules/share/share.model.ts
 *   - src/modules/share/share.controller.ts
 *
 * Notes:
 *  - There is at most ONE active share per user (Share.userId is unique).
 *  - POST /share is idempotent: returns the existing active share if one exists.
 *  - GET /share/:shareId is PUBLIC (no auth) and returns an array of content
 *    items with the same shape as the authed list, but tags are still
 *    ObjectId strings and cannot be resolved without auth.
 */
export type Share = {
  _id: string;
  userId: string;
  shareId: string;
  isActive: boolean;
  expiresAt?: string;
  visibility: "public" | "private";
  createdAt?: string;
  updatedAt?: string;
};

/** Public share content row — what GET /share/:shareId returns per item. */
export type PublicSharedItem = {
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
  tags: string[]; // ObjectId strings — not resolvable in the public view.
  createdAt: string;
};

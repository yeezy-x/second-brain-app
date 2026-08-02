import { http } from "@/lib/api-client";
import type { AdminContentItem, AdminUser } from "@/features/admin/types";

export const adminApi = {
  listUsers: (): Promise<AdminUser[]> => http.get<AdminUser[]>("/admin/users"),

  getUserContent: (userId: string): Promise<AdminContentItem[]> =>
    http.get<AdminContentItem[]>(`/admin/users/${userId}/content`),

  deleteContent: (id: string): Promise<{ success: boolean }> =>
    http.delete<{ success: boolean }>(`/admin/content/${id}`),

  deleteTag: (id: string): Promise<{ success: boolean }> =>
    http.delete<{ success: boolean }>(`/admin/tags/${id}`),

  disableShare: (shareId: string): Promise<unknown> =>
    http.patch(`/admin/shares/${shareId}/disable`),
};

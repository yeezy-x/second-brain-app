export type AdminUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
};

export type AdminContentItem = {
  _id: string;
  type: string;
  title?: string;
  url?: string;
  tags: { id: string; name: string }[] | string[];
  createdAt: string;
};

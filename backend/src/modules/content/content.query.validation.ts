import { z } from "zod";

export const contentQuerySchema = z.object({
  type: z.enum(["tweet", "video", "document", "link"]).optional(),
  tag: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
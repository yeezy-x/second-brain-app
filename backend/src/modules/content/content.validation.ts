import { z } from "zod";

export const createContentSchema = z.object({
  type: z.enum(["tweet", "video", "document", "link"]),
  title: z.string().optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
});
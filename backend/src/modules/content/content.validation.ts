import { refine, z } from "zod";
export const ContentTypeEnum = z.enum(["tweet","video","document","link"]);

export const createContentSchema = z
  .object({
    type: ContentTypeEnum,
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional(),
    url: z.string().trim().url().optional(),
    tags: z
      .array(z.string().trim().min(1).max(30))
      .max(10)
      .optional()
      .transform((tags) =>
        tags
          ? [...new Set(tags.map((t) => t.trim().toLowerCase()))].filter(
              (t) => t.length > 0
            )
          : tags
      ),
  })
  .strict()
  .refine(
    (data) => {
      if (data.type === "link" || data.type === "video") {
        return !!data.url;
      }
      return true;
    },
    {
      message: "URL is required for link/video content",
      path: ["url"],
    }
  );

export const contentQuerySchema = z
  .object({
    type: ContentTypeEnum.optional(),
    tag: z.string().trim().max(30).optional(),
    cursor: z.string().optional(), 
    limit: z
      .coerce.number()    
      .min(1)
      .max(50)
      .default(10),
    search: z.string().trim().max(100).optional(),
    mode: z.enum(["keyword", "semantic"]).optional().default("keyword"),
  })
  .strict()
  .refine(
    (data) => data.mode !== "semantic" || (data.search && data.search.length > 0),
    {
      message: "search is required for semantic mode",
      path: ["search"],
    }
  );

export const contentIdSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

export const updateContentSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  url: z.string().trim().url().optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional().transform((tags) =>
    tags
      ? [...new Set(tags.map((t) => t.trim().toLowerCase()))].filter((t) => t.length > 0)
      : tags
  ),
}).strict().refine((data) => {
  return !!data.url || !!data.title || !!data.description || (data.tags && data.tags.length > 0);
  }, {
  message: "URL or title or description or tags must be provided",
  path: ["url", "title", "description", "tags.length"],
});


export const addContentTagSchema = z
  .object({
    tag: z
      .string()
      .trim()
      .min(1)
      .max(30)
      .transform((t) => t.toLowerCase()),
  })
  .strict();
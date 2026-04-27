import { z } from "zod";
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
      .string()
      .refine((val) => !isNaN(Number(val)), {
        message: "Limit must be a number",
      })
      .transform((val) => Number(val))
      .refine((val) => val > 0 && val <= 50, {
        message: "Limit must be between 1 and 50",
      }),
    search: z.string().trim().max(100).optional(),
  })
  .strict();

export const contentIdSchema = z.object({
  id: z
    .string()
    .length(24)
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid ID format"),
});
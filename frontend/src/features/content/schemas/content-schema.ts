import { z } from "zod";

/**
 * Mirror of backend createContentSchema (strict).
 *
 * Notes:
 *  - title: trim, 1..200
 *  - description: trim, max 2000, optional
 *  - url: trim, valid URL, REQUIRED for "link" and "video"
 *  - tags: trimmed, lowercase, deduped, length 1..30 each, max 10
 */
export const contentTypeSchema = z.enum(["tweet", "video", "document", "link"]);

const tagItemSchema = z
  .string()
  .trim()
  .min(1, "Tag must not be empty")
  .max(30, "Tag must be at most 30 characters");

export const createContentFormSchema = z
  .object({
    type: contentTypeSchema,
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(200, "Title must be at most 200 characters"),
    description: z
      .string()
      .trim()
      .max(2000, "Description must be at most 2000 characters")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    url: z
      .string()
      .trim()
      .url("Enter a valid URL (must include https://)")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    tags: z
      .array(tagItemSchema)
      .max(10, "You can add at most 10 tags")
      .optional()
      .transform((tags) =>
        tags
          ? Array.from(
              new Set(
                tags
                  .map((t) => t.trim().toLowerCase())
                  .filter((t) => t.length > 0)
              )
            )
          : undefined
      ),
  })
  .superRefine((data, ctx) => {
    if ((data.type === "link" || data.type === "video") && !data.url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "URL is required for link and video content",
      });
    }
  });

export type CreateContentFormValues = z.input<typeof createContentFormSchema>;
export type CreateContentParsedValues = z.output<typeof createContentFormSchema>;

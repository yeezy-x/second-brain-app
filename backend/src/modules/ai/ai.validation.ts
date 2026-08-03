import { z } from "zod";

export const prefillSchema = z
  .object({
    url: z.string().trim().url("Invalid URL"),
  })
  .strict();

export type PrefillDTO = z.infer<typeof prefillSchema>;

export const chatSchema = z
  .object({
    messages: z
      .array(
        z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().trim().min(1).max(4000),
        })
      )
      .min(1)
      .max(20),
  })
  .strict();

export type ChatDTO = z.infer<typeof chatSchema>;
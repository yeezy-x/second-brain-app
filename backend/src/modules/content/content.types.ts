import { z } from "zod";
import {
  createContentSchema,
  contentQuerySchema,
  ContentTypeEnum,
  updateContentSchema,
  contentIdSchema
} from "./content.validation";

export type ContentType = z.infer<typeof ContentTypeEnum>;

export type CreateContentDTO = z.infer<typeof createContentSchema>;

export type ContentGetQuery = z.infer<typeof contentQuerySchema>;

export type ContentUpdateDTO = z.infer<typeof updateContentSchema>;

export type ContentIdDTO = z.infer<typeof contentIdSchema>;

export interface ContentResponseDTO {
  id: string;
  type: ContentType;
  title?: string;
  url?: string;
  description?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type ContentMetadataDTO = {
  title?: string;
  description?: string;
  image?: string;
  ai?: {
    summary: string;
    suggestedTags: string[];
    keyPoints: string[];
    enrichedAt: string;
    status?: "pending" | "done" | "failed";
  };
};

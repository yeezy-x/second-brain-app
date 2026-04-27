import { z } from "zod";
import {
  createContentSchema,
  contentQuerySchema,
  ContentTypeEnum
} from "./content.validation";

export type ContentType = z.infer<typeof ContentTypeEnum>;

export type CreateContentDTO = z.infer<typeof createContentSchema>;

export type GetContentQuery = z.infer<typeof contentQuerySchema>;

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
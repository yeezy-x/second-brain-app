import { ApiError } from "../../utils/ApiError";
import { extractMetadata } from "../../utils/metadata";
import { Content } from "./content.model";
import {
  createContentRepo,
  getContentRepo,
  deleteContentRepo,
} from "./content.repository";
import { CreateContentDTO } from "./content.types";

export const createContentService = async (
  userId: string,
  data: CreateContentDTO
) => {
  let metadata={};
  if(data.url){
    metadata=await extractMetadata(data.url);
  }
  if (!data.type) {
    throw new ApiError(400, "Content type required");
  }
  if (data.type === "video" && !data.url) {
    throw new ApiError(400, "Video must have a URL");
  }
  if (data.type === "document" && !data.title) {
    throw new ApiError(400, "Document must have a title");
  }
  const normalizedTags=data.tags?.map(tag => tag.trim().toLowerCase()) || [];
  if(data.url){
    const existing=await Content.findOne({
      userId,
      url: data.url
    })
    if(existing) return existing
  }
  try {
    return await createContentRepo({
      ...data,
      tags: normalizedTags,
      metadata,
      userId,
    });
  } catch (err: any) {
    if (err.code === 11000) {
      throw new ApiError(400, "Content already exists");
    }
    throw err;
  }
};

export const getContentService = async (userId: string, query: any) => {
  const { type, tag, page = 1, limit = 10 } = query;
  const parsedLimit = Math.min(Number(limit), 50);
  const parsedPage = Math.max(Number(page), 1);

  const filter: any = { userId };
  if (type) filter.type = type;
  if (tag) filter.tags = { $in: [tag] };

  const skip = (parsedPage - 1) * parsedLimit;

  const [data, total] = await Promise.all([
    Content.find(filter)
      .lean()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit),

    Content.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.ceil(total / parsedLimit),
    },
  };
};
export const deleteContentService = async (
  id: string,
  userId: string
) => {
  const content = await deleteContentRepo(id, userId);
  if (!content) {
    throw new ApiError(404, "Content not found");
  }
  return { success: true };
};
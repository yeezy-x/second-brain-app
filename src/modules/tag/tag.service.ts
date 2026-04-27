import { ApiError } from "../../utils/ApiError";
import { Tag } from "./tag.model";
import { redis } from "../../config/redis";
import { logger } from "../../core/logger";

export const createTagService = async (userId: string, name: string) => {
  try {
    const tag = await Tag.create({ name, userId });
    try {
      await redis.del(`tags:${userId}`);
    } catch (err) {
      logger.warn({
        message: "Redis DEL failed",
        key: `tags:${userId}`,
      });
    }
    return tag;
  } catch (err: any) {
    if (err.code === 11000) {
      throw new ApiError(400, "Tag already exists");
    }
    throw err;
  }
};

export const getSingleTagService = async (
  userId: string,
  tagId: string
) => {
  const tag = await Tag.findOne({ _id: tagId, userId }).lean();
  if (!tag) {
    throw new ApiError(404, "Tag not found");
  }
  return tag;
};

export const getTagsService = async (userId: string) => {
  const cacheKey = `tags:${userId}`;
  let cached = null;
  try {
    cached = await redis.get(cacheKey);
  } catch (err) {
    logger.warn({
      message: "Redis GET failed",
      key: cacheKey,
    });
  }
  if (cached) {
    return JSON.parse(cached);
  }
  const tags = await Tag.find({ userId }).lean();
  try {
    await redis.set(cacheKey, JSON.stringify(tags), "EX", 300);
  } catch (err) {
    logger.warn({
      message: "Redis SET failed",
      key: cacheKey,
    });
  }
  return tags;
};
import { Prisma } from "@prisma/client";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../config/db";
import { redis } from "../../config/redis";
import { logger } from "../../core/logger";

export const createTagService = async (userId: string, name: string) => {
  try {
    const tag = await prisma.tag.create({
      data: { name: name.toLowerCase(), userId },
    });
    try {
      await redis.del(`tags:${userId}`);
    } catch {
      logger.warn({
        message: "Redis DEL failed",
        key: `tags:${userId}`,
      });
    }
    return { ...tag, _id: tag.id };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new ApiError(400, "Tag already exists");
    }
    throw err;
  }
};

export const getSingleTagService = async (userId: string, tagId: string) => {
  const tag = await prisma.tag.findFirst({
    where: { id: tagId, userId },
  });
  if (!tag) {
    throw new ApiError(404, "Tag not found");
  }
  return { ...tag, _id: tag.id };
};

export const getTagsService = async (userId: string) => {
  const cacheKey = `tags:${userId}`;
  let cached = null;
  try {
    cached = await redis.get(cacheKey);
  } catch {
    logger.warn({
      message: "Redis GET failed",
      key: cacheKey,
    });
  }
  if (cached) {
    return JSON.parse(cached);
  }
  const tags = await prisma.tag.findMany({ where: { userId } });
  const mapped = tags.map((t) => ({ ...t, _id: t.id }));
  try {
    await redis.set(cacheKey, JSON.stringify(mapped), "EX", 300);
  } catch {
    logger.warn({
      message: "Redis SET failed",
      key: cacheKey,
    });
  }
  return mapped;
};

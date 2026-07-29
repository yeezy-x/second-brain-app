import { ApiError } from "../../utils/ApiError";
import { getContentByUserId } from "../content/content.service";
import { prisma } from "../../config/db";
import { nanoid } from "nanoid";
import { redis } from "../../config/redis";
import { logger } from "../../core/logger";

export const createShareService = async (userId: string) => {
  const existing = await prisma.share.findFirst({
    where: { userId, isActive: true },
  });
  if (existing) {
    return { ...existing, _id: existing.id };
  }
  try {
    const share = await prisma.share.create({
      data: {
        userId,
        shareId: nanoid(10),
      },
    });
    return { ...share, _id: share.id };
  } catch {
    const fallback = await prisma.share.findFirst({
      where: { userId, isActive: true },
    });
    if (fallback) return { ...fallback, _id: fallback.id };
    throw new ApiError(500, "Failed to create share link");
  }
};

export const getSharedContentService = async (shareId: string) => {
  const cacheKey = `share:${shareId}`;
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
  const share = await prisma.share.findFirst({
    where: { shareId, isActive: true },
  });
  if (!share) {
    throw new ApiError(404, "Share not found");
  }
  if (share.expiresAt && share.expiresAt < new Date()) {
    throw new ApiError(403, "Share link expired");
  }
  const content = await getContentByUserId(share.userId);
  try {
    await redis.set(cacheKey, JSON.stringify(content), "EX", 60);
  } catch {
    logger.warn({
      message: "Redis SET failed",
      key: cacheKey,
    });
  }
  return content;
};

export const disableShareService = async (shareId: string, userId: string) => {
  const share = await prisma.share.findFirst({
    where: { shareId, userId },
  });
  if (!share) {
    throw new ApiError(404, "Share not found or access denied");
  }
  if (!share.isActive) {
    return { ...share, _id: share.id };
  }
  const updated = await prisma.share.update({
    where: { id: share.id },
    data: { isActive: false },
  });
  try {
    await redis.del(`share:${shareId}`);
  } catch {
    logger.warn({
      message: "Redis DEL failed",
      key: `share:${shareId}`,
    });
  }
  return { ...updated, _id: updated.id };
};

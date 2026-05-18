import { ApiError } from "../../utils/ApiError";
import { getContentByUserId } from "../content/content.service";
import { Share } from "./share.model";
import { nanoid } from "nanoid";
import { redis } from "../../config/redis";
import { logger } from "../../core/logger";

export const createShareService = async (userId: string) => {
  const existing = await Share.findOne({ userId, isActive: true });
  if (existing) {
    return existing;
  }
  try {
    return await Share.create({
      userId,
      shareId: nanoid(10),
    });
  } catch (err: any) {
    const fallback = await Share.findOne({ userId, isActive: true });
    if (fallback) return fallback;
    throw err;
  }
};

export const getSharedContentService = async (shareId: string) => {
  const cacheKey = `share:${shareId}`;
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
  const share = await Share.findOne({ shareId, isActive: true }).lean();
  if (!share) {
    throw new ApiError(404, "Share not found");
  }
  if (share.expiresAt && share.expiresAt < new Date()) {
    throw new ApiError(403, "Share link expired");
  }
  const content = await getContentByUserId(share.userId.toString());
  try {
    await redis.set(cacheKey, JSON.stringify(content), "EX", 60);
  } catch (err) {
    logger.warn({
      message: "Redis SET failed",
      key: cacheKey,
    });
  }
  return content;
};

export const disableShareService = async (
  shareId: string,
  userId: string
) => {
  const share = await Share.findOne({ shareId, userId });
  if (!share) {
    throw new ApiError(404, "Share not found or access denied");
  }
  if (!share.isActive) {
    return share;
  }
  share.isActive = false;
  await share.save();
  try {
    await redis.del(`share:${shareId}`);
  } catch (err) {
    logger.warn({
      message: "Redis DEL failed",
      key: `share:${shareId}`,
    });
  }
  return share;
};
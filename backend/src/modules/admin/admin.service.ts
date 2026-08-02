import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../config/db";
import { redis } from "../../config/redis";
import { logger } from "../../core/logger";
import { getContentByUserId } from "../content/content.service";

export const listUsersService = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return users;
};

export const getUserContentService = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return getContentByUserId(userId);
};

export const adminDeleteContentService = async (id: string) => {
  const content = await prisma.content.findUnique({ where: { id } });
  if (!content) {
    throw new ApiError(404, "Content not found");
  }
  await prisma.content.delete({ where: { id } });
  try {
    await redis.incr(`version:${content.userId}`);
    await redis.expire(`version:${content.userId}`, 3600);
  } catch {
    logger.warn("Redis version bump failed");
  }
  return { success: true };
};

export const adminDeleteTagService = async (id: string) => {
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) {
    throw new ApiError(404, "Tag not found");
  }
  await prisma.tag.delete({ where: { id } });
  try {
    await redis.del(`tags:${tag.userId}`);
  } catch {
    logger.warn({
      message: "Redis DEL failed",
      key: `tags:${tag.userId}`,
    });
  }
  return { success: true };
};

export const adminDisableShareService = async (shareId: string) => {
  const share = await prisma.share.findFirst({ where: { shareId } });
  if (!share) {
    throw new ApiError(404, "Share not found");
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

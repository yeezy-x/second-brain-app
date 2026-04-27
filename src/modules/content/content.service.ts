import mongoose from "mongoose";
import crypto from "crypto";

import { ApiError } from "../../utils/ApiError";
import { Content } from "./content.model";
import { Tag } from "../tag/tag.model";
import { CreateContentDTO, GetContentQuery } from "./content.types";

import { metadataQueue } from "../../jobs/queue"
import { redis } from "../../config/redis";
import { logger } from "../../core/logger";
const hash = (obj: any) =>
  crypto.createHash("md5").update(JSON.stringify(obj)).digest("hex");

const withTimeout = async (promise: Promise<any>, ms = 100) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Redis timeout")), ms)
    ),
  ]);
};

export const createContentService = async (
  userId: string,
  data: CreateContentDTO
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const tags = data.tags || [];
    const tagDocs = await Promise.all(
      tags.map((name) =>
        Tag.findOneAndUpdate(
          { name, userId },
          { $setOnInsert: { name, userId } },
          { upsert: true, new: true, session }
        )
      )
    );
    const [content] = await Content.create(
      [
        {
          userId,
          type: data.type,
          title: data.title,
          description: data.description,
          url: data.url,
          tags: tagDocs.map((t) => t._id),
        },
      ],
      { session }
    );
    await session.commitTransaction();
    await redis.incr(`version:${userId}`);
    await redis.expire(`version:${userId}`, 3600);
    if (data.url) {
      await metadataQueue.add(
        "process-metadata",
        {
          contentId: content._id.toString(),
          url: data.url,
        },
        {
          attempts: 3, 
          backoff: {
            type: "exponential",
            delay: 2000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        }
      );
    }
    return content;
  } catch (error: any) {
    await session.abortTransaction();
    if (error.code === 11000) {
      throw new ApiError(409, "Content already exists");
    }
    logger.error({ err: error }, "createContentService failed");
    throw error;
  } finally {
    session.endSession();
  }
};

export const getContentService = async (
  userId: string,
  query: GetContentQuery
) => {
  const { type, tag, cursor, limit = 10, search } = query;
  const parsedLimit = Math.min(Number(limit) || 10, 50);
  const version = await redis.get(`version:${userId}`);
  const cacheKey = `content:${userId}:${version || "v0"}:${hash({
    cursor,
    type,
    tag,
    search,
    limit: parsedLimit,
  })}`;
  const lockKey = `lock:${cacheKey}`;
  try {
    const cached = await withTimeout(redis.get(cacheKey));
    if (cached) {
      logger.info({ cache: "hit", key: cacheKey });
      return JSON.parse(cached);
    }
  } catch {
    logger.warn("Redis unavailable, fallback to DB");
  }

  const lock = await redis.set(lockKey, "1", "EX", 5, "NX");
  if (!lock) {
    logger.info({ cache: "waiting", key: cacheKey });
  }

  const filter: Record<string, any> = {
    userId: new mongoose.Types.ObjectId(userId),
  };
  if (search) filter.$text = { $search: search };
  if (type) filter.type = type;
  if (tag) {
    const tagDoc = await Tag.findOne({
      name: tag.toLowerCase(),
      userId,
    });
    if (!tagDoc) {
      return { data: [], nextCursor: null };
    }
    filter.tags = tagDoc._id;
  }

  let cursorData: { createdAt: string; _id: string } | null = null;
  if (cursor) {
    try {
      const parsed = JSON.parse(
        Buffer.from(cursor, "base64").toString("utf-8")
      );
      if (
        typeof parsed._id !== "string" ||
        typeof parsed.createdAt !== "string"
      ) {
        throw new Error();
      }
      cursorData = parsed;
    } catch {
      throw new ApiError(400, "Invalid cursor");
    }
  }

  if (cursorData) {
    const cursorDate = new Date(cursorData.createdAt);
    const cursorId = new mongoose.Types.ObjectId(cursorData._id);
    filter.$or = [
      { createdAt: { $lt: cursorDate } },
      {
        createdAt: cursorDate,
        _id: { $lt: cursorId },
      },
    ];
  }

  const queryBuilder = Content.find(filter)
    .limit(parsedLimit)
    .lean();
  if (search) {
    queryBuilder.sort({ score: { $meta: "textScore" } });
    queryBuilder.select({
      score: { $meta: "textScore" },
      _id: 1,
      title: 1,
      type: 1,
      url: 1,
      metadata: 1,
      tags: 1,
      createdAt: 1,
    });
  } else {
    queryBuilder
      .sort({ createdAt: -1, _id: -1 })
      .select("_id title type url metadata tags createdAt");
  }

  const data = await queryBuilder;
  let nextCursor: string | null = null;
  if (data.length > 0) {
    const last = data[data.length - 1];
    nextCursor = Buffer.from(
      JSON.stringify({
        createdAt: last.createdAt,
        _id: last._id,
      })
    ).toString("base64");
  }

  const result = { data, nextCursor };
  const ttl = 60 + Math.floor(Math.random() * 20);
  try {
    await redis.set(cacheKey, JSON.stringify(result), "EX", ttl);
    logger.info({ cache: "set", key: cacheKey });
  } catch (err) {
    logger.error({ err }, "Redis write failed");
  }
  await redis.del(lockKey);
  return result;
};

export const deleteContentService = async (
  id: string,
  userId: string
) => {
  const content = await Content.findOneAndDelete({
    _id: id,
    userId,
  });
  if (!content) {
    throw new ApiError(404, "Content not found");
  }
  await redis.incr(`version:${userId}`);
  await redis.expire(`version:${userId}`, 3600);
  return { success: true };
};

export const getContentByUserId = async (userId: string) => {
  return Content.find({ userId })
    .sort({ createdAt: -1 })
    .lean()
    .select("title type url metadata tags createdAt");
};
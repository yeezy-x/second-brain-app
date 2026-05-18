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

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

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
  const url =
    typeof data.url === "string" && data.url.trim() !== ""
      ? data.url.trim().toLowerCase()
      : undefined;
  const tags = data.tags || [];
  const tagDocs = await Promise.all(
    tags.map((name) =>
      Tag.findOneAndUpdate(
        { name: name.toLowerCase(), userId },
        { $setOnInsert: { name: name.toLowerCase(), userId } },
        { upsert: true, new: true }
      )
    )
  );
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const [content] = await Content.create(
      [
        {
          userId,
          type: data.type,
          title: data.title,
          description: data.description,
          url,
          tags: tagDocs.map((t) => t._id),
        },
      ],
      { session }
    );
    await session.commitTransaction();
    await redis.incr(`version:${userId}`);
    await redis.expire(`version:${userId}`, 3600);
    const jobId = crypto.createHash("sha256").update(`${userId}:${url}`).digest("hex");
    if (url) {
      await metadataQueue.add(
        "process-metadata",
        {
          contentId: content._id.toString(),
          url,
        },
        {
          jobId,
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
  const { type, tag, cursor, limit, search } = query;

  // ❌ prevent broken pagination
  if (search && cursor) {
    throw new ApiError(400, "Cursor pagination not supported with search");
  }

  const parsedLimit = limit;
  const useCache = !search;

  /* // 🔥 Non-blocking version fetch
  const versionPromise = redis
    .get(`version:${userId}`)
    .catch(() => null);*/

  // 🔥 Build cache key early
  /* const cacheKeyBase = {
    cursor,
    type,
    tag,
    search,
    limit: parsedLimit,
  };*/

  //let version: string | null = null;

  if (useCache) {
    const cacheKey = `content:${userId}:${hash({
        cursor,
        type,
        tag,
        search,
        limit,
      })}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info({ cache: "hit", key: cacheKey });
        return JSON.parse(cached);
      }
    } catch {
      logger.warn("Redis read failed, fallback to DB");
    }
  }

  // 🔥 Build DB filter
  const filter: Record<string, any> = {
    userId: new mongoose.Types.ObjectId(userId),
  };

  if (search) filter.$text = { $search: search };
  if (type) filter.type = type;

  // 🔥 Tag resolution (non-blocking Redis)
  if (tag) {
    const tagCacheKey = `tag:${userId}:${tag.toLowerCase()}`;
    let tagId: string | null = null;

    try {
      tagId = await redis.get(tagCacheKey);
    } catch {}

    if (!tagId) {
      const tagDoc = await Tag.findOne({
        name: tag.toLowerCase(),
        userId,
      }).lean();

      if (!tagDoc) {
        return { data: [], nextCursor: null };
      }

      tagId = tagDoc._id.toString();

      // async cache write (don’t await)
      redis.set(tagCacheKey, tagId, "EX", 3600).catch(() => {});
    }

    filter.tags = new mongoose.Types.ObjectId(tagId);
  }

  // 🔥 Cursor decoding
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
      { createdAt: cursorDate, _id: { $lt: cursorId } },
    ];
  }

  // 🔥 Query
  const queryBuilder = Content.find(filter)
    .limit(parsedLimit + 1) // 👈 important
    .lean();

  if (search) {
    queryBuilder
      .sort({ score: { $meta: "textScore" } })
      .select({
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
      .select("_id title type url tags createdAt");
  }

  const results = await queryBuilder;

  // 🔥 Pagination handling
  let nextCursor: string | null = null;
  let data = results;

  if (!search && results.length > parsedLimit) {
    const last = results[parsedLimit - 1];

    nextCursor = Buffer.from(
      JSON.stringify({
        createdAt: last.createdAt,
        _id: last._id,
      })
    ).toString("base64");

    data = results.slice(0, parsedLimit);
  }

  const response = { data, nextCursor };

  // 🔥 Async cache write (non-blocking)
  if (useCache) {
    const cacheKey = `content:${userId}:${hash({
      cursor,
      type,
      tag,
      search,
      limit,
    })}`;

    const ttl = 60 + Math.floor(Math.random() * 20);

    redis
      .set(cacheKey, JSON.stringify(response), "EX", ttl)
      .then(() => logger.info({ cache: "set", key: cacheKey }))
      .catch(() => {});
  }

  return response;
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
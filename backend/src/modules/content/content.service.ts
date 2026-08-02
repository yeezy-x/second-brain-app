import { Prisma } from "@prisma/client";
import crypto from "crypto";

import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../config/db";
import { CreateContentDTO, GetContentQuery } from "./content.types";

import { metadataQueue } from "../../jobs/queue";
import { redis } from "../../config/redis";
import { logger } from "../../core/logger";

const hash = (obj: unknown) =>
  crypto.createHash("md5").update(JSON.stringify(obj)).digest("hex");

const getContentVersion = async (userId: string): Promise<string> => {
  try {
    return (await redis.get(`version:${userId}`)) ?? "0";
  } catch {
    return "0";
  }
};

const bumpContentVersion = async (userId: string): Promise<void> => {
  try {
    await redis.incr(`version:${userId}`);
    await redis.expire(`version:${userId}`, 3600);
  } catch {
    logger.warn("Redis version bump failed");
  }
};

const mapContent = <T extends { id: string; tags?: { tag: { id: string; name: string } }[] }>(
  content: T
) => {
  const { tags, ...rest } = content;
  return {
    ...rest,
    _id: content.id,
    tags: tags?.map((t) => t.tag) ?? [],
  };
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

  try {
    const content = await prisma.$transaction(async (tx) => {
      const tagDocs = await Promise.all(
        tags.map((name) =>
          tx.tag.upsert({
            where: {
              name_userId: { name: name.toLowerCase(), userId },
            },
            create: { name: name.toLowerCase(), userId },
            update: {},
          })
        )
      );

      return tx.content.create({
        data: {
          userId,
          type: data.type,
          title: data.title,
          description: data.description,
          url,
          tags: {
            create: tagDocs.map((t) => ({ tagId: t.id })),
          },
        },
        include: {
          tags: { include: { tag: true } },
        },
      });
    });

    await bumpContentVersion(userId);

    if (url) {
      const jobId = crypto
        .createHash("sha256")
        .update(`${userId}:${url}`)
        .digest("hex");
      await metadataQueue.add(
        "process-metadata",
        {
          contentId: content.id,
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

    return mapContent(content);
  } catch (error) {
    logger.error({ err: error }, "createContentService failed");
    throw error;
  }
};

export const getContentService = async (
  userId: string,
  query: GetContentQuery
) => {
  const { type, tag, cursor, limit, search } = query;

  if (search && cursor) {
    throw new ApiError(400, "Cursor pagination not supported with search");
  }

  const parsedLimit = limit;
  const useCache = !search;
  const version = useCache ? await getContentVersion(userId) : "0";

  if (useCache) {
    const cacheKey = `content:${userId}:v${version}:${hash({
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

  const where: Prisma.ContentWhereInput = { userId };

  if (type) where.type = type;

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (tag) {
    const tagCacheKey = `tag:${userId}:${tag.toLowerCase()}`;
    let tagId: string | null = null;

    try {
      tagId = await redis.get(tagCacheKey);
    } catch {}

    if (!tagId) {
      const tagDoc = await prisma.tag.findUnique({
        where: {
          name_userId: { name: tag.toLowerCase(), userId },
        },
      });

      if (!tagDoc) {
        return { data: [], nextCursor: null };
      }

      tagId = tagDoc.id;
      redis.set(tagCacheKey, tagId, "EX", 3600).catch(() => {});
    }

    where.tags = { some: { tagId } };
  }

  let cursorData: { createdAt: string; id: string } | null = null;

  if (cursor) {
    try {
      const parsed = JSON.parse(
        Buffer.from(cursor, "base64").toString("utf-8")
      );

      if (
        typeof parsed.id !== "string" ||
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
    where.AND = [
      {
        OR: [
          { createdAt: { lt: cursorDate } },
          {
            AND: [
              { createdAt: cursorDate },
              { id: { lt: cursorData.id } },
            ],
          },
        ],
      },
    ];
  }

  const results = await prisma.content.findMany({
    where,
    take: parsedLimit + 1,
    orderBy: search
      ? [{ createdAt: "desc" }, { id: "desc" }]
      : [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      title: true,
      type: true,
      url: true,
      metadata: search ? true : false,
      tags: { include: { tag: { select: { id: true, name: true } } } },
      createdAt: true,
    },
  });

  let nextCursor: string | null = null;
  let data = results;

  if (!search && results.length > parsedLimit) {
    const last = results[parsedLimit - 1];
    nextCursor = Buffer.from(
      JSON.stringify({
        createdAt: last.createdAt,
        id: last.id,
      })
    ).toString("base64");
    data = results.slice(0, parsedLimit);
  }

  const response = {
    data: data.map(mapContent),
    nextCursor,
  };

  if (useCache) {
    const cacheKey = `content:${userId}:v${version}:${hash({
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

export const deleteContentService = async (id: string, userId: string) => {
  const result = await prisma.content.deleteMany({
    where: { id, userId },
  });
  if (result.count === 0) {
    throw new ApiError(404, "Content not found");
  }

  await bumpContentVersion(userId);

  return { success: true };
};

export const getContentByUserId = async (userId: string) => {
  const contents = await prisma.content.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      url: true,
      metadata: true,
      tags: { include: { tag: { select: { id: true, name: true } } } },
      createdAt: true,
    },
  });
  return contents.map(mapContent);
};

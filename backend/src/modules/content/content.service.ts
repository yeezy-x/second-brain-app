import { Prisma } from "@prisma/client";
import crypto from "crypto";

import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../config/db";
import { CreateContentDTO, GetContentQuery, ContentType } from "./content.types";

import { metadataQueue } from "../../jobs/queue";
import { enqueueEmbeddingJob } from "../../jobs/embedding.job";
import { redis } from "../../config/redis";
import { logger } from "../../core/logger";
import { env } from "../../config/env";
import { generateEmbedding } from "../../services/ai/client";
import { toVectorLiteral } from "../../utils/vector";

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

const contentListSelect = {
  id: true,
  title: true,
  type: true,
  url: true,
  metadata: true,
  metadataStatus: true,
  tags: { include: { tag: { select: { id: true, name: true } } } },
  createdAt: true,
} satisfies Prisma.ContentSelect;

type ContentListRow = Prisma.ContentGetPayload<{
  select: typeof contentListSelect;
}>;

async function semanticContentSearch(
  userId: string,
  search: string,
  limit: number,
  type?: ContentType,
  tag?: string
): Promise<{ data: ReturnType<typeof mapContent>[]; nextCursor: null } | null> {
  const queryEmbedding = await generateEmbedding(search);
  if (!queryEmbedding || queryEmbedding.length !== 768) {
    return null;
  }

  const vectorLiteral = toVectorLiteral(queryEmbedding);

  let tagId: string | null = null;
  if (tag) {
    const tagDoc = await prisma.tag.findUnique({
      where: {
        name_userId: { name: tag.toLowerCase(), userId },
      },
    });
    if (!tagDoc) {
      return { data: [], nextCursor: null };
    }
    tagId = tagDoc.id;
  }

  const conditions = [
    `c."userId" = $2::uuid`,
    `c.embedding IS NOT NULL`,
    `c."aiStatus" = 'done'::"AiStatus"`,
  ];
  const params: unknown[] = [vectorLiteral, userId];
  let paramIdx = 3;

  if (type) {
    conditions.push(`c.type = $${paramIdx}::"ContentType"`);
    params.push(type);
    paramIdx += 1;
  }

  let joinClause = "";
  if (tagId) {
    joinClause = `INNER JOIN "ContentTag" ct ON ct."contentId" = c.id AND ct."tagId" = $${paramIdx}::uuid`;
    params.push(tagId);
    paramIdx += 1;
  }

  params.push(limit);
  const limitParam = paramIdx;

  const sql = `
    SELECT c.id, 1 - (c.embedding <=> $1::vector) AS score
    FROM "Content" c
    ${joinClause}
    WHERE ${conditions.join(" AND ")}
    ORDER BY c.embedding <=> $1::vector
    LIMIT $${limitParam}
  `;

  const semanticResults = await prisma.$queryRawUnsafe<
    Array<{ id: string; score: number | string }>
  >(sql, ...params);

  if (semanticResults.length === 0) {
    return { data: [], nextCursor: null };
  }

  const ids = semanticResults.map((r) => r.id);
  const scoreMap = new Map(
    semanticResults.map((r) => [r.id, Number(r.score)])
  );

  const contents = await prisma.content.findMany({
    where: { id: { in: ids }, userId },
    select: contentListSelect,
  });

  const contentById = new Map(contents.map((c) => [c.id, c]));
  const ordered = ids
    .map((id) => contentById.get(id))
    .filter((c): c is ContentListRow => c != null);

  return {
    data: ordered.map((c) => ({
      ...mapContent(c),
      relevanceScore: scoreMap.get(c.id),
    })),
    nextCursor: null,
  };
}

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
    } else {
      await enqueueEmbeddingJob(content.id, userId);
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
  const { type, tag, cursor, limit, search, mode } = query;

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
      mode,
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

  if (search && mode === "semantic" && env.AI_ENABLED) {
    const semanticResult = await semanticContentSearch(
      userId,
      search,
      parsedLimit,
      type,
      tag
    );
    if (semanticResult) {
      return semanticResult;
    }
    logger.info({ userId, search }, "Semantic search fallback to keyword");
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
    select: contentListSelect,
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
      mode,
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

export const addContentTagService = async (
  id: string,
  userId: string,
  tagName: string
) => {
  const content = await prisma.content.findFirst({
    where: { id, userId },
    include: { tags: { include: { tag: true } } },
  });

  if (!content) {
    throw new ApiError(404, "Content not found");
  }

  const existingNames = new Set(content.tags.map((t) => t.tag.name));
  if (existingNames.has(tagName)) {
    throw new ApiError(400, "Tag already applied to this content");
  }

  if (content.tags.length >= 10) {
    throw new ApiError(400, "Maximum 10 tags per content item");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const tag = await tx.tag.upsert({
      where: {
        name_userId: { name: tagName, userId },
      },
      create: { name: tagName, userId },
      update: {},
    });

    await tx.contentTag.create({
      data: { contentId: id, tagId: tag.id },
    });

    return tx.content.findUnique({
      where: { id },
      select: contentListSelect,
    });
  });

  if (!updated) {
    throw new ApiError(404, "Content not found");
  }

  await bumpContentVersion(userId);

  try {
    await redis.del(`tags:${userId}`);
  } catch {
    logger.warn("Redis tag cache invalidation failed");
  }

  return mapContent(updated);
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

import { createHash } from "crypto";
import { prisma } from "../config/db";
import { env } from "../config/env";
import { logger } from "../core/logger";
import { redis } from "../config/redis";
import { generateEmbedding } from "../services/ai/client";
import { toVectorLiteral } from "../utils/vector";
import { embeddingQueue } from "./queue";

type MetadataJson = {
  ai?: { summary?: string };
};

export function buildEmbeddingText(content: {
  title: string | null;
  description: string | null;
  metadata: unknown;
}): string {
  const meta = (content.metadata ?? {}) as MetadataJson;
  return [content.title, content.description, meta.ai?.summary]
    .filter((part) => typeof part === "string" && part.trim())
    .join("\n\n")
    .trim();
}

async function bumpContentVersion(userId: string) {
  try {
    await redis.incr(`version:${userId}`);
    await redis.expire(`version:${userId}`, 3600);
  } catch {
    logger.warn("Redis version bump failed");
  }
}

async function setAiStatus(contentId: string, status: "done" | "failed") {
  await prisma.$executeRawUnsafe(
    `UPDATE "Content" SET "aiStatus" = $1::"AiStatus" WHERE id = $2::uuid`,
    status,
    contentId
  );
}

export async function enqueueEmbeddingJob(contentId: string, userId: string) {
  if (!env.AI_ENABLED) return;

  const jobId = createHash("sha256")
    .update(`embed:${userId}:${contentId}`)
    .digest("hex");

  await embeddingQueue.add(
    "process-embedding",
    { contentId, userId },
    {
      jobId,
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
}

export async function processEmbedding(contentId: string, userId: string) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      metadata: true,
    },
  });

  if (!content) {
    logger.warn({ contentId }, "Embedding skipped: content not found");
    return;
  }

  const text = buildEmbeddingText(content);
  if (!text) {
    logger.info({ contentId }, "Embedding skipped: no text to embed");
    await setAiStatus(contentId, "failed");
    return;
  }

  try {
    const embedding = await generateEmbedding(text);
    if (!embedding) {
      logger.info({ contentId }, "Embedding skipped: AI disabled");
      return;
    }

    if (embedding.length !== 768) {
      throw new Error(`Expected 768-dim embedding, got ${embedding.length}`);
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "Content"
       SET embedding = $1::vector,
           "aiStatus" = 'done'::"AiStatus"
       WHERE id = $2::uuid`,
      toVectorLiteral(embedding),
      contentId
    );

    await bumpContentVersion(userId);
    logger.info({ contentId }, "Embedding processed");
  } catch (err) {
    logger.error({ err, contentId }, "Embedding processing failed");
    await setAiStatus(contentId, "failed");
    throw err;
  }
}

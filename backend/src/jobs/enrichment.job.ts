import crypto from "crypto";
import { prisma } from "../config/db";
import { env } from "../config/env";
import { logger } from "../core/logger";
import { redis } from "../config/redis";
import { generateSummary } from "../services/ai/client";
import { enrichmentQueue } from "./queue";
import { enqueueEmbeddingJob } from "./embedding.job";

// reuse same cache-bump pattern as content.service.ts
async function bumpContentVersion(userId: string) {
  try {
    await redis.incr(`version:${userId}`);
    await redis.expire(`version:${userId}`, 3600);
  } catch {
    logger.warn("Redis version bump failed");
  }
}

type MetadataJson = {
  title?: string;
  description?: string;
  image?: string;
  ai?: {
    summary: string;
    suggestedTags: string[];
    keyPoints: string[];
    enrichedAt: string;
    status?: "pending" | "done" | "failed";
  };
};

export async function enqueueEnrichmentJob(contentId: string, userId: string) {
  if (!env.AI_ENABLED) return;

  const jobId = crypto
    .createHash("sha256")
    .update(`${userId}:${contentId}`)
    .digest("hex");

  await enrichmentQueue.add(
    "process-enrichment",
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

export async function processEnrichment(contentId: string, userId: string) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      url: true,
      metadata: true,
    },
  });

  if (!content) {
    logger.warn({ contentId }, "Enrichment skipped: content not found");
    return;
  }

  const existing = (content.metadata ?? {}) as MetadataJson;

  const result = await generateSummary({
    title: existing.title ?? content.title ?? "",
    description: existing.description ?? content.description ?? "",
    url: content.url ?? "",
  });

  if (!result) {
    logger.info({ contentId }, "Enrichment skipped: AI disabled or unavailable");
    await enqueueEmbeddingJob(contentId, userId);
    return;
  }

  const metadata: MetadataJson = {
    ...existing,
    ai: {
      summary: result.summary,
      suggestedTags: result.suggestedTags,
      keyPoints: result.keyPoints,
      enrichedAt: new Date().toISOString(),
      status: "done",
    },
  };

  await prisma.content.update({
    where: { id: contentId },
    data: { metadata },
  });

  await bumpContentVersion(userId);
  logger.info({ contentId }, "Enrichment processed");

  await enqueueEmbeddingJob(contentId, userId);
}
import { Worker } from "bullmq";
import Redis from "ioredis";
import { processMetadata } from "./metadata.job";
import { logger } from "../core/logger";
import { EMBEDDING_QUEUE, ENRICHMENT_QUEUE, METADATA_QUEUE } from "./queue";
import { env } from "../config/env";
import { connectDB } from "../config/db";
import { getRedisOptions } from "../config/redisOptions";
import { processEnrichment } from "./enrichment.job";
import { processEmbedding } from "./embedding.job";

const connection = new Redis(env.REDIS_URL, getRedisOptions());

const startWorker = async () => {
  try {
    await connectDB();
    logger.info("✅ Postgres connected (worker)");

    const worker = new Worker(
      METADATA_QUEUE,
      async (job) => {
        try {
          const { contentId, url } = job.data;
          logger.info({ jobId: job.id, contentId }, "Processing metadata job");
          await processMetadata(contentId, url);
        } catch (err) {
          logger.error({ err, job: job.data }, "PROCESS METADATA FAILED");
          throw err;
        }
      },
      {
        connection,
        concurrency: 2,
      }
    );

    const enrichmentWorker = new Worker(
      ENRICHMENT_QUEUE,
      async (job) => {
        const { contentId, userId } = job.data;
        logger.info({ jobId: job.id, contentId }, "Processing enrichment job");
        await processEnrichment(contentId, userId);
      },
      { connection, concurrency: 1 } // 1 is safer for free Gemini rate limits
    );

    const embeddingWorker = new Worker(
      EMBEDDING_QUEUE,
      async (job) => {
        const { contentId, userId } = job.data;
        logger.info({ jobId: job.id, contentId }, "Processing embedding job");
        await processEmbedding(contentId, userId);
      },
      { connection, concurrency: 1 }
    );

    embeddingWorker.on("completed", (job) => {
      logger.info({ jobId: job.id }, "Embedding job completed");
    });
    embeddingWorker.on("failed", (job, err) => {
      logger.error({ jobId: job?.id, err }, "Embedding job failed");
    });
    embeddingWorker.on("error", (err) => {
      logger.error({ err }, "Embedding worker error");
    });

    worker.on("completed", (job) => {
      logger.info({ jobId: job.id }, "Job completed");
    });
    worker.on("failed", (job, err) => {
      logger.error({ jobId: job?.id, err }, "Job failed");
    });
    enrichmentWorker.on("completed", (job) => {
      logger.info({ jobId: job.id }, "Enrichment job completed");
    });
    enrichmentWorker.on("failed", (job, err) => {
      logger.error({ jobId: job?.id, err }, "Enrichment job failed");
    });
    worker.on("error", (err) => {
      logger.error({ err }, "Worker error");
    });
    enrichmentWorker.on("error", (err) => {
      logger.error({ err }, "Enrichment worker error");
    });
    logger.info("🚀 Metadata, enrichment and embedding workers started");
  } catch (err) {
    logger.error({ err }, "Worker startup failed");
    process.exit(1);
  }
};



startWorker();

import { Worker } from "bullmq";
import IORedis from "ioredis";
import { processMetadata } from "./metadata.job";
import { logger } from "../core/logger";
import { METADATA_QUEUE } from "./queue";

const connection = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

export const metadataWorker = new Worker(
  METADATA_QUEUE,
  async (job) => {
    const { contentId, url } = job.data;
    logger.info({ jobId: job.id, contentId }, "Processing metadata job");
    await processMetadata(contentId, url);
  },{connection,concurrency: 5,}
);

metadataWorker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Job completed");
});

metadataWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, err }, "Job failed");
});

metadataWorker.on("error", (err) => {
  logger.error({ err }, "Worker error");
});
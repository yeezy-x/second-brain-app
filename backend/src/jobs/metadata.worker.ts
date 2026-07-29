import { Worker } from "bullmq";
import Redis from "ioredis";
import { processMetadata } from "./metadata.job";
import { logger } from "../core/logger";
import { METADATA_QUEUE } from "./queue";
import { env } from "../config/env";
import { connectDB } from "../config/db";

const connection = new Redis(env.REDIS_URL!);

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

    worker.on("completed", (job) => {
      logger.info({ jobId: job.id }, "Job completed");
    });
    worker.on("failed", (job, err) => {
      logger.error({ jobId: job?.id, err }, "Job failed");
    });
    worker.on("error", (err) => {
      logger.error({ err }, "Worker error");
    });
    logger.info("🚀 Metadata worker started");
  } catch (err) {
    logger.error({ err }, "Worker startup failed");
    process.exit(1);
  }
};

startWorker();

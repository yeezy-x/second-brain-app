import { Worker } from "bullmq";
import IORedis from "ioredis";
import mongoose from "mongoose";
import { processMetadata } from "./metadata.job";
import { logger } from "../core/logger";
import { METADATA_QUEUE } from "./queue";
import { env } from "../config/env";

const connection = new IORedis({
  host: env.REDIS_HOST || "127.0.0.1",
  port: Number(env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

const startWorker = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info("✅ MongoDB connected (worker)");
    mongoose.connection.on("error", (err) => {
      logger.error({ err }, "MongoDB error");
    });
    mongoose.connection.on("disconnected", () => {
      logger.error("MongoDB disconnected");
    });

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
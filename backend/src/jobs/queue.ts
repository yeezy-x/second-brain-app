import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL!,{
  tls:{},
  maxRetriesPerRequest: null,
});

export const METADATA_QUEUE = "metadata";
export const metadataQueue = new Queue(METADATA_QUEUE, {
  connection,
});
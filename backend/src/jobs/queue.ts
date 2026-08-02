import { Queue } from "bullmq";
import Redis from "ioredis";
import { env } from "../config/env";
import { getRedisOptions } from "../config/redisOptions";

const connection = new Redis(env.REDIS_URL, getRedisOptions());

export const METADATA_QUEUE = "metadata";
export const metadataQueue = new Queue(METADATA_QUEUE, {
  connection,
});

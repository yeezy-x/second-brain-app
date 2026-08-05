import { ConnectionOptions, Queue } from "bullmq";
import Redis from "ioredis";
import { env } from "../config/env";
import { getRedisOptions } from "../config/redisOptions";

const connection = new Redis(env.REDIS_URL, getRedisOptions());

export const METADATA_QUEUE = "metadata";
export const ENRICHMENT_QUEUE = "enrichment";
export const EMBEDDING_QUEUE = "embedding";
export const metadataQueue = new Queue(METADATA_QUEUE, { connection: connection as ConnectionOptions });
export const enrichmentQueue = new Queue(ENRICHMENT_QUEUE, { connection: connection as ConnectionOptions });
export const embeddingQueue = new Queue(EMBEDDING_QUEUE, { connection: connection as ConnectionOptions });


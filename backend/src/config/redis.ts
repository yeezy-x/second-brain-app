import Redis from "ioredis";
import { logger } from "../core/logger";

export const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    if(times>20) return null;
    return Math.min(times * 50, 2000);
  }
});

redis.on("connect", () => {
  logger.info("✅ Redis connected");
});

redis.on("error", (err) => {
  logger.error({ err }, "❌ Redis error");
});

redis.on("reconnecting", () => {
  logger.warn("🔄 Redis reconnecting...");
});

redis.on("ready", () => {
  logger.info("🚀 Redis ready to use");
});

redis.on("end", () => {
  logger.warn("❌ Redis connection closed");
});
import Redis from "ioredis";
import { logger } from "../core/logger";
import { env } from "./env";

export const redis = new Redis(env.REDIS_URL,{
  maxRetriesPerRequest: null,
  tls:{},
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
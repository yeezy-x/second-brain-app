import Redis from "ioredis";
import { logger } from "../core/logger";
import { env } from "./env";
import { getRedisOptions } from "./redisOptions";

export const redis = new Redis(env.REDIS_URL, getRedisOptions());

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
import type { RedisOptions } from "ioredis";
import { env } from "./env";

export function getRedisOptions(): RedisOptions {
  const useTls = env.REDIS_URL.startsWith("rediss://");

  return {
    maxRetriesPerRequest: null,
    ...(useTls ? { tls: {} } : {}),
    retryStrategy: (times) => {
      if (times > 20) return null;
      return Math.min(times * 50, 2000);
    },
  };
}

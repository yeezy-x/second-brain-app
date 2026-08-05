import type { RedisOptions } from "ioredis";
import { env } from "./env";

export function getRedisOptions(): RedisOptions {
  return {
    tls: {},
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      if (times > 20) return null;
      return Math.min(times * 50, 2000);
    },
  };
}

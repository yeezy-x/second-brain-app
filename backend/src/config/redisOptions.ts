import type { RedisOptions } from "ioredis";

export function getRedisOptions(): RedisOptions {
  return {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,

    tls: {},

    retryStrategy(times) {
      if (times > 20) return null;
      return Math.min(times * 100, 2000);
    },

    keepAlive: 30000,
  };
}
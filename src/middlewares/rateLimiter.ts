import { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis";
import { ApiError } from "../utils/ApiError";

type Options = {
  window: number; 
  limit: number;
  prefix: string;
};

const getClientKey = (req: Request) => {
  return req.ip || req.socket.remoteAddress || "unknown";
};

export const createRateLimiter = (options: Options) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `${options.prefix}:${getClientKey(req)}`;
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, options.window);
      }
      if (count > options.limit) {
        return next(
          new ApiError(429, "Too many requests, please try again later")
        );
      }
      return next();
    } catch (err) {
      return next();
    }
  };
};

export const authRateLimiter = createRateLimiter({
  window: 60 * 60, 
  limit: 100,
  prefix: "rl:auth",
});

export const rateLimiter = createRateLimiter({
  window: 15 * 60, 
  limit: 100,
  prefix: "rl:global",
});
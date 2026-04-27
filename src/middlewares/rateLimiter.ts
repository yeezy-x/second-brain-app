import { rateLimit } from "express-rate-limit";
import RedisStore from "rate-limit-redis"
import { Request, Response } from "express";
import { redis } from "../config/redis";
import { Command } from "ioredis";
import type { Store } from "express-rate-limit";
import { ipKeyGenerator } from "express-rate-limit";

const createStore = (prefix: string): Store =>
  new RedisStore({
    sendCommand: (...args: string[]) =>
      redis.sendCommand(
        new Command(args[0], args.slice(1))
      ) as unknown as Promise<any>,
    prefix,
  }) as unknown as Store;

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: createStore("rl:global"),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
  ipKeyGenerator(req.ip || req.socket.remoteAddress || ""),

  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many requests, please try again later",
      requestId: (req as any).id,
    });
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  store: createStore("rl:auth"),
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: "Too many auth attempts. Try again later.",
      requestId: (req as any).id,
    });
  },
});
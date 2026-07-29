import dotenv from "dotenv";
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || "3000",
  DATABASE_URL: process.env.DATABASE_URL!,
  DIRECT_URL: process.env.DIRECT_URL!,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_REST_URL!,
  UPSTASH_REDIS_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN!,
  REDIS_URL: process.env.REDIS_URL!,
};

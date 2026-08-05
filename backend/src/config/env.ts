import dotenv from "dotenv";
dotenv.config({ override: true });

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || "3000",
  DATABASE_URL: process.env.DATABASE_URL!,
  DIRECT_URL: process.env.DIRECT_URL!,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  REDIS_URL: process.env.REDIS_URL!,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "https://second-brain-app-nu.vercel.app",
  COOKIE_SECURE: process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production",
  GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
  AI_MODEL: process.env.AI_MODEL ?? "gemini-3.5-flash-lite",
  AI_EMBEDDING_MODEL: process.env.AI_EMBEDDING_MODEL ?? "gemini-embedding-001",
  AI_ENABLED: process.env.AI_ENABLED === "true",
};

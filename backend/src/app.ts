import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import aiRoutes from "./modules/ai/ai.routes";
import { aiRateLimiter } from "./middlewares/rateLimiter";

import { logger } from "./core/logger";
import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { authRateLimiter, rateLimiter } from "./middlewares/rateLimiter";
import { requestId } from "./middlewares/requestId.middleware";

import authRoutes from "./modules/auth/auth.routes";
import contentRoutes from "./modules/content/content.routes";
import tagRoutes from "./modules/tag/tag.routes";
import shareRoutes from "./modules/share/share.routes";
import adminRoutes from "./modules/admin/admin.routes";

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(requestId);
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));
if (process.env.NODE_ENV !== "test") {
  app.use(rateLimiter);
}
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    uptime: process.uptime(),
  });
});

app.use("/api/v1/auth", authRateLimiter, authRoutes);
app.use("/api/v1/content", contentRoutes);
app.use("/api/v1/tags", tagRoutes);
app.use("/api/v1/share", shareRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/ai", aiRateLimiter, aiRoutes);


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorMiddleware);

export default app;

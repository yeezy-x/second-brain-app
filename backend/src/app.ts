import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { logger } from "./utils/logger";
import { errorMiddleware } from "./middlewares/error.middleware";
import authRoutes from "./modules/auth/auth.routes";
import contentRoutes from "./modules/content/content.routes";
import tagRoutes from "./modules/tag/tag.routes";
import shareRoutes from "./modules/share/share.routes";
import { rateLimiter } from "./middlewares/rateLimiter";
const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(express.json());

app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);
app.use(rateLimiter)

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

/* test route 
app.get(
  "/error-test",
  asyncHandler(async (req, res) => {
    throw new ApiError(400, "Test error working");
  })
); */ 

app.use("/api/auth",authRoutes)
app.use("/api/content", contentRoutes)
app.use("/api/tags", tagRoutes);
app.use("/api/share", shareRoutes);

app.use(errorMiddleware)
export default app;
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { logger } from "./core/logger";
import { errorMiddleware } from "./middlewares/error.middleware";
import { authRateLimiter, rateLimiter } from "./middlewares/rateLimiter";
import { requestId } from "./middlewares/requestId.middleware";

import authRoutes from "./modules/auth/auth.routes";
import contentRoutes from "./modules/content/content.routes";
import tagRoutes from "./modules/tag/tag.routes";
import shareRoutes from "./modules/share/share.routes";

const app = express();

app.set("trust proxy", 1); // trust first proxy (if behind a reverse proxy like nginx or a load balancer) to get correct client IP for rate limiting and logging

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
//use of helmet
// -> by default web frameworks like express do not include security headers 
// in responses, which can leave applications vulnerable to various attacks. 
// Helmet helps mitigate these risks by setting appropriate HTTP headers, such 
// as Content-Security-Policy, X-Content-Type-Options, and X-Frame-Options, 
// among others. By using Helmet, developers can enhance the security of their 
// applications with minimal effort, making it a crucial tool for any web application development.

app.use(cors());
app.use(requestId);
app.use(express.json({ limit:"10kb"})); // why limit the body size?
// Limiting the body size of incoming requests is a security measure to prevent 
// denial-of-service (DoS) attacks. If an attacker sends a very large request 
// body, it can consume excessive server resources, leading to slow performance 
// or even crashing the server. By setting a reasonable limit (like 10kb), we 
// can protect the server from such attacks while still allowing legitimate 
// requests to be processed effectively.
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

app.use("/api/v1/auth",authRateLimiter ,authRoutes);
app.use("/api/v1/content", contentRoutes);
app.use("/api/v1/tags", tagRoutes);
app.use("/api/v1/share", shareRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorMiddleware); // why is this after the routes?
// The error handling middleware is placed after the route 
// handlers to ensure that it can catch and handle any errors
//  that occur during the processing of requests. If it were 
// placed before the routes, it would not be able to catch
//  errors that happen within the route handlers, and those 
// errors would go unhandled, potentially leading to crashes
//  or unresponsive behavior in the application. By placing 
// it after the routes, we ensure that any errors thrown in 
// the route handlers are properly caught and handled by the
//  error middleware, allowing for graceful error responses 
// and improved stability of the application.

export default app;
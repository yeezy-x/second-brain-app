import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { logger } from "../core/logger";
import { env } from "../config/env";
import { ZodError } from "zod";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const baseLog = {
    message: err.message,
    path: req.originalUrl,
    method: req.method,
    requestId: req.id,
  };

  const baseResponse = {
    success: false,
    requestId: req.id,
  };

  if (err instanceof ApiError) {
    logger.warn(baseLog); 
    return res.status(err.statusCode).json({
      ...baseResponse,
      message: err.message,
      ...(env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  if (err instanceof ZodError) {
    logger.warn({
      ...baseLog,
      errors: err.flatten().fieldErrors,
    });
    return res.status(400).json({
      ...baseResponse,
      message: "Validation Failed",
      errors: err.flatten().fieldErrors,
      ...(env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
  logger.error({
    ...baseLog,
    stack: err.stack,
  });
  return res.status(500).json({
    ...baseResponse,
    message: "Internal Server Error",
    code: "INTERNAL_SERVER_ERROR",
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

export const requestId = (req: Request,res: Response,next: NextFunction) => {
  const existingId = req.headers["x-request-id"] as string | undefined;
  const id = existingId || randomUUID();
  req.id = id;
  res.setHeader("x-request-id", id);
  next();
};
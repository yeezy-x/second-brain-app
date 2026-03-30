import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Unauthorized");
  }
  const token = authHeader.split(" ")[1];
  try{const decoded = verifyAccessToken(token);
  req.user={ id: decoded.id };
  next();}
 catch (error) {
    throw new ApiError(401, "Invalid or expired token");
  }
};
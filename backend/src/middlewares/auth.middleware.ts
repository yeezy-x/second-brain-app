import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";
import { ACCESS_COOKIE } from "../utils/cookies";

function extractAccessToken(req: Request): string | null {
  const fromCookie = req.cookies?.[ACCESS_COOKIE];
  if (typeof fromCookie === "string" && fromCookie.length > 0) {
    return fromCookie;
  }
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const token = extractAccessToken(req);
  if (!token) {
    return next(new ApiError(401, "Unauthorized"));
  }
  try {
    const decoded = verifyAccessToken(token);
    if (!decoded?.id || !decoded?.role) {
      return next(new ApiError(401, "Invalid token payload"));
    }
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

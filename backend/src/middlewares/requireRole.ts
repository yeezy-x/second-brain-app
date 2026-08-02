import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { ApiError } from "../utils/ApiError";

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return next(new ApiError(401, "Unauthorized"));
    }
    if (!roles.includes(req.user.role as Role)) {
      return next(new ApiError(403, "Forbidden"));
    }
    next();
  };

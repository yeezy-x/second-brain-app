import { ZodObject, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

export const validate = 
  (schema: ZodObject) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const message = result.error.issues[0].message;
        throw new ApiError(400, message);
      }
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };

export const validateQuery =
  (schema: ZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      throw new ApiError(400, result.error.issues[0].message);
    }
    req.validatedQuery = result.data;
    next();
  };
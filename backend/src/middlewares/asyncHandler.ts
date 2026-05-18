import { Request, Response, NextFunction } from "express";

export const asyncHandler =(fn: Function) =>(req: Request, res: Response, next: NextFunction) => {
    try {
      Promise.resolve(fn(req, res, next)).catch(next);
    } catch (err) {
      next(err);
    }
  };
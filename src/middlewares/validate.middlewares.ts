import { ZodTypeAny, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";

const validate =
  <T extends ZodTypeAny>(schema: T,source: "body" | "query" | "params") =>
  (req: Request, res: Response, next: NextFunction) => {
    const data = req[source];
    const result = schema.safeParse(data);
    if (!result.success) {
      return next(result.error);
    }
    if (source==="body") req.validatedBody=result.data;
    if (source==="query") req.validatedQuery=result.data;
    if (source==="params") req.validatedParams=result.data;
    return next();
  };

export const validateBody = <T extends ZodTypeAny>(schema: T) =>
  validate(schema, "body");

export const validateQuery = <T extends ZodTypeAny>(schema: T) =>
  validate(schema, "query");

export const validateParams = <T extends ZodTypeAny>(schema: T) =>
  validate(schema, "params");
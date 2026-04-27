import { ZodSchema } from "zod";
import { ApiError } from "./ApiError";
export const validate = <T>(schema: ZodSchema<T>, data: unknown): T => {
  const result=schema.safeParse(data);
  if (!result.success) {
    throw new ApiError(400, "Validation failed");
  }
  return result.data;
};
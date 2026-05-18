import { Request } from "express";

declare module "express-serve-static-core" {
  interface Request {
    id: String;
    user?: {
      id: string;
    };
    validatedBody?: unknown;
    validatedQuery?: unknown;
    validatedParams?: unknown;
  }
}

declare global {
  namespace Express {
    interface User {
      id: string;
    }
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}
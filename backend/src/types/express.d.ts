import { Request } from "express";

declare module "express-serve-static-core" {
  interface Request {
    id: string;
    user?: {
      id: string;
      role: "USER" | "ADMIN";
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
      role: "USER" | "ADMIN";
    }
    interface Request {
      user?: {
        id: string;
        role: "USER" | "ADMIN";
      };
    }
  }
}

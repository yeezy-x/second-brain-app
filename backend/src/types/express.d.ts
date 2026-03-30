import { Request } from "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
    };
  }
}

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: string;
    };
    validatedQuery?: any; // we improve later
  }
}
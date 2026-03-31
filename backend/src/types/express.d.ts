import { Request } from "express";
import { GetContentQuery } from "./content.dto";

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
    validatedQuery?: GetContentQuery; // we improve later
  }
}
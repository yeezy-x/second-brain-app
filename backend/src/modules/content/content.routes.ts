import { Router } from "express";
import {
  createContent,
  getContent,
  deleteContent,
} from "./content.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middlewares";
import { createContentSchema } from "./content.validation";
import { contentQuerySchema } from "./content.query.validation";

const contentRoutes = Router();
contentRoutes.use(authMiddleware);

contentRoutes.post("/", validate(createContentSchema), createContent);
contentRoutes.get("/", validate(contentQuerySchema), getContent);
contentRoutes.delete("/:id", deleteContent);

export default contentRoutes;
import { Router } from "express";
import {
  createContent,
  getContent,
  deleteContent,
  addContentTag,
} from "./content.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { validateBody, validateQuery,validateParams } from "../../middlewares/validate.middlewares";
import { addContentTagSchema, contentIdSchema, createContentSchema,contentQuerySchema } from "./content.validation";

const contentRoutes = Router();
contentRoutes.use(authMiddleware);

contentRoutes.post("/", validateBody(createContentSchema), createContent);
contentRoutes.get("/", validateQuery(contentQuerySchema), getContent);
contentRoutes.post(
  "/:id/tags",
  validateParams(contentIdSchema),
  validateBody(addContentTagSchema),
  addContentTag
);
contentRoutes.delete("/:id", validateParams(contentIdSchema), deleteContent);

export default contentRoutes;
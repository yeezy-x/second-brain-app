import { Router } from "express";
import { createTag, getTags } from "./tag.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const tagRoutes = Router();

tagRoutes.use(authMiddleware);

tagRoutes.post("/", createTag);
tagRoutes.get("/", getTags);

export default tagRoutes;
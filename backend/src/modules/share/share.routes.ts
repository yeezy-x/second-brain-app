import { Router } from "express";
import {
  createShare,
  getSharedContent,
} from "./share.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const shareRoutes = Router();

shareRoutes.post("/", authMiddleware, createShare);
shareRoutes.get("/:shareId", getSharedContent);

export default shareRoutes;
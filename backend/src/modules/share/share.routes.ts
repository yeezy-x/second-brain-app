import { Router } from "express";
import {
  createShare,
  disableShare,
  getSharedContent,
} from "./share.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const shareRoutes = Router();

shareRoutes.post("/", authMiddleware, createShare);
shareRoutes.get("/:shareId", getSharedContent);
shareRoutes.patch("/:shareId/disable", authMiddleware, disableShare)

export default shareRoutes;
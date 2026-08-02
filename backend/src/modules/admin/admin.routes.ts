import { Router } from "express";
import { Role } from "@prisma/client";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/requireRole";
import {
  listUsers,
  getUserContent,
  deleteContent,
  deleteTag,
  disableShare,
} from "./admin.controller";

const adminRoutes = Router();

adminRoutes.use(authMiddleware, requireRole(Role.ADMIN));

adminRoutes.get("/users", listUsers);
adminRoutes.get("/users/:userId/content", getUserContent);
adminRoutes.delete("/content/:id", deleteContent);
adminRoutes.delete("/tags/:id", deleteTag);
adminRoutes.patch("/shares/:shareId/disable", disableShare);

export default adminRoutes;

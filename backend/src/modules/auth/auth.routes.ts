import { Router } from "express";
import {
  signup,
  login,
  refreshToken,
  logout,
  me,
} from "./auth.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const authRoutes = Router();

authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.post("/refresh-token", refreshToken);
authRoutes.post("/logout", logout);
authRoutes.get("/me", authMiddleware, me);

export default authRoutes;

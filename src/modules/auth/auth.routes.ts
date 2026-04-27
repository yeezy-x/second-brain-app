import { Router } from "express";
import { signup, login, refreshToken, logout } from "./auth.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const authRoutes=Router();

authRoutes.post("/signup",signup);
authRoutes.post("/login",authMiddleware,login);
authRoutes.post("/refresh-token",authMiddleware,refreshToken);
authRoutes.post("/logout",authMiddleware,logout);

export default authRoutes;
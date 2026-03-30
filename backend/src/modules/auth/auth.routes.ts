import { Router } from "express";
import { signup, login, refreshToken } from "./auth.controller";

const authRoutes = Router();

authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.post("/refresh-token", refreshToken);

export default authRoutes;
import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { signUpService, loginService, refreshTokenService, logoutService } from "./auth.service";
import {ApiResponse} from "../../utils/ApiResponse";

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await signUpService(email, password);
  res.status(201).json(new ApiResponse(201, user, "User created"));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const tokens = await loginService(email, password);
  res.status(200).json(new ApiResponse(200, tokens, "Login successful"));
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const token = await refreshTokenService(refreshToken);
  res.status(200).json(new ApiResponse(200, token));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await logoutService(userId);
  res.status(200).json(new ApiResponse(200, null, "Logged out"));
});
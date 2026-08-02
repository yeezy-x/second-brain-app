import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import {
  signUpService,
  loginService,
  refreshTokenService,
  logoutService,
  meService,
  resolveLogoutUserId,
} from "./auth.service";
import { signupSchema, loginSchema } from "./auth.schema";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { validate } from "../../utils/validate";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from "../../utils/cookies";

function requireUser(req: Request): string {
  if (!req.user?.id) {
    throw new ApiError(401, "Unauthorized");
  }
  return req.user.id;
}

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = validate(signupSchema, req.body);
  const { user, accessToken, refreshToken } = await signUpService(
    email,
    password
  );
  setAuthCookies(res, { accessToken, refreshToken });
  res.status(201).json(new ApiResponse(user, "User created"));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = validate(loginSchema, req.body);
  const { user, accessToken, refreshToken } = await loginService(
    email,
    password
  );
  setAuthCookies(res, { accessToken, refreshToken });
  res.status(200).json(new ApiResponse(user, "Login successful"));
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token =
    (req.cookies?.[REFRESH_COOKIE] as string | undefined) ||
    (req.body?.refreshToken as string | undefined) ||
    "";
  const result = await refreshTokenService(token);
  setAuthCookies(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
  res.status(200).json(new ApiResponse(result.user, "Token refreshed"));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const accessToken =
    (req.cookies?.[ACCESS_COOKIE] as string | undefined) ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : undefined);
  const refreshToken =
    (req.cookies?.[REFRESH_COOKIE] as string | undefined) ||
    (req.body?.refreshToken as string | undefined);

  const userId = await resolveLogoutUserId(accessToken, refreshToken);
  if (userId) {
    await logoutService(userId);
  }
  clearAuthCookies(res);
  res.status(200).json(new ApiResponse(null, "Logged out"));
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  const user = await meService(userId);
  res.status(200).json(new ApiResponse(user, "OK"));
});

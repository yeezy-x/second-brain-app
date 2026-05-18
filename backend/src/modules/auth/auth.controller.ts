import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import {
  signUpService,
  loginService,
  refreshTokenService,
  logoutService,
} from "./auth.service";
import { signupSchema, loginSchema, refreshTokenSchema } from "./auth.schema";
import { ApiResponse } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { validate } from "../../utils/validate";

function requireUser(req:Request):string{
  if(!req.user?.id){
    throw new ApiError(401,"Unauthorized");
  }
  return req.user.id;
}

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = validate(signupSchema, req.body);
  const user = await signUpService(email, password);
  res
    .status(201)
    .json(new ApiResponse(user, "User created"));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = validate(loginSchema, req.body);
  const tokens = await loginService(email, password);
  res
    .status(200)
    .json(new ApiResponse(tokens, "Login successful"));
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = validate(refreshTokenSchema, req.body);
  const token = await refreshTokenService(refreshToken);
  res
    .status(200)
    .json(new ApiResponse(token, "Token refreshed"));
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUser(req);
  await logoutService(userId);
  res
    .status(200)
    .json(new ApiResponse(null, "Logged out"));
});
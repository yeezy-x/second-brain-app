import bcrypt from "bcrypt";
import { ApiError } from "../../utils/ApiError";
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserRefreshToken,
} from "../user/user.repository";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export const signUpService = async (email: string, password: string) => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await createUser({
    email,
    password: hashedPassword,
  });
  const refreshToken = generateRefreshToken(user.id);
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  return updateUserRefreshToken(user.id, hashedRefreshToken);
};

export const loginService = async (email: string, password: string) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new ApiError(400, "Invalid email or password");
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid email or password");
  }
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  await updateUserRefreshToken(user.id, hashedRefreshToken);
  return { accessToken, refreshToken };
};

export const refreshTokenService = async (token: string) => {
  if (!token) {
    throw new ApiError(401, "No refresh token");
  }
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string };
  const user = await findUserById(decoded.id);
  if (!user || !user.refreshToken) {
    throw new ApiError(401, "User not found");
  }
  const isMatch = await bcrypt.compare(token, user.refreshToken);
  if (!isMatch) {
    throw new ApiError(401, "Invalid refresh token");
  }
  const newAccessToken = generateAccessToken(user.id);
  const newRefreshToken = generateRefreshToken(user.id);
  const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);
  await updateUserRefreshToken(user.id, hashedNewRefreshToken);
  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logoutService = async (userId: string) => {
  const user = await findUserById(userId);
  if (user) {
    await updateUserRefreshToken(userId, null);
  }
};

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
import { Role } from "@prisma/client";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

type AuthResult = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

const toAuthUser = (user: {
  id: string;
  email: string;
  role: Role;
}): AuthUser => ({
  id: user.id,
  email: user.email,
  role: user.role,
});

export const signUpService = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await createUser({
    email,
    password: hashedPassword,
  });
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id, user.role);
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  await updateUserRefreshToken(user.id, hashedRefreshToken);
  return {
    user: toAuthUser(user),
    accessToken,
    refreshToken,
  };
};

export const loginService = async (
  email: string,
  password: string
): Promise<AuthResult> => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new ApiError(400, "Invalid email or password");
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid email or password");
  }
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id, user.role);
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  await updateUserRefreshToken(user.id, hashedRefreshToken);
  return {
    user: toAuthUser(user),
    accessToken,
    refreshToken,
  };
};

export const refreshTokenService = async (
  token: string
): Promise<AuthResult> => {
  if (!token) {
    throw new ApiError(401, "No refresh token");
  }
  let decoded: { id: string; role?: Role };
  try {
    decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
      id: string;
      role?: Role;
    };
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }
  const user = await findUserById(decoded.id);
  if (!user || !user.refreshToken) {
    throw new ApiError(401, "User not found");
  }
  const isMatch = await bcrypt.compare(token, user.refreshToken);
  if (!isMatch) {
    throw new ApiError(401, "Invalid refresh token");
  }
  const newAccessToken = generateAccessToken(user.id, user.role);
  const newRefreshToken = generateRefreshToken(user.id, user.role);
  const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);
  await updateUserRefreshToken(user.id, hashedNewRefreshToken);
  return {
    user: toAuthUser(user),
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

/** Resolve user id from access or refresh token without requiring a valid access JWT. */
export const resolveLogoutUserId = async (
  accessToken?: string,
  refreshToken?: string
): Promise<string | null> => {
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, env.JWT_ACCESS_SECRET) as {
        id: string;
      };
      if (decoded?.id) return decoded.id;
    } catch {
      // fall through to refresh
    }
  }

  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as {
        id: string;
      };
      if (!decoded?.id) return null;
      const user = await findUserById(decoded.id);
      if (!user?.refreshToken) return decoded.id;
      const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
      return isMatch ? user.id : decoded.id;
    } catch {
      return null;
    }
  }

  return null;
};

export const meService = async (userId: string): Promise<AuthUser> => {
  const user = await findUserById(userId);
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }
  return toAuthUser(user);
};

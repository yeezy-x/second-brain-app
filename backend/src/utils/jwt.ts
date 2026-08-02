import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env";

export type JwtPayload = {
  id: string;
  role: Role;
};

export const generateAccessToken = (userId: string, role: Role) => {
  return jwt.sign({ id: userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (userId: string, role: Role) => {
  return jwt.sign({ id: userId, role }, env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
};

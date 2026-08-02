import { Response } from "express";
import { env } from "../config/env";

export const ACCESS_COOKIE = "sb_access";
export const REFRESH_COOKIE = "sb_refresh";

const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const baseCookieOptions = {
  httpOnly: true as const,
  secure: env.COOKIE_SECURE,
};

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string }
): void {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...baseCookieOptions,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE_MS,
  });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseCookieOptions,
    sameSite: "strict",
    path: "/api/v1/auth",
    maxAge: REFRESH_MAX_AGE_MS,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, {
    ...baseCookieOptions,
    sameSite: "lax",
    path: "/",
  });
  res.clearCookie(REFRESH_COOKIE, {
    ...baseCookieOptions,
    sameSite: "strict",
    path: "/api/v1/auth",
  });
}

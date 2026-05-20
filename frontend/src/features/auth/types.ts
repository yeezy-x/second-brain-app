/**
 * Auth feature types — exact mirror of backend DTOs.
 *
 * Source of truth:
 *   - src/modules/auth/auth.schema.ts
 *   - src/modules/auth/auth.service.ts
 */
export type SignupRequest = {
  email: string;
  password: string;
};

export type LoginRequest = SignupRequest;

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

/** Signup returns the user object (NOT tokens). The user must then log in. */
export type SignupResponse = {
  _id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

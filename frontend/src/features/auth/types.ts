/**
 * Auth user returned by signup / login / refresh /me.
 * Tokens live in HTTP-only cookies — never stored in JS.
 */
export type Role = "USER" | "ADMIN";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

export type SignupRequest = {
  email: string;
  password: string;
};

export type LoginRequest = SignupRequest;

/** Signup now creates a session (cookies) and returns the safe user DTO. */
export type SignupResponse = AuthUser;

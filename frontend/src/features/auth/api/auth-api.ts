import { http } from "@/lib/api-client";
import type {
  AuthUser,
  LoginRequest,
  SignupRequest,
  SignupResponse,
} from "@/features/auth/types";

export const authApi = {
  signup: (body: SignupRequest): Promise<SignupResponse> =>
    http.post<SignupResponse, SignupRequest>("/auth/signup", body),

  login: (body: LoginRequest): Promise<AuthUser> =>
    http.post<AuthUser, LoginRequest>("/auth/login", body),

  logout: (): Promise<null> => http.post<null>("/auth/logout"),

  me: (): Promise<AuthUser> => http.get<AuthUser>("/auth/me"),
};

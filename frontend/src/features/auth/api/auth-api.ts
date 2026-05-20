import { http } from "@/lib/api-client";
import type {
  AuthTokens,
  LoginRequest,
  SignupRequest,
  SignupResponse,
} from "@/features/auth/types";

export const authApi = {
  signup: (body: SignupRequest): Promise<SignupResponse> =>
    http.post<SignupResponse, SignupRequest>("/auth/signup", body),

  login: (body: LoginRequest): Promise<AuthTokens> =>
    http.post<AuthTokens, LoginRequest>("/auth/login", body),

  logout: (): Promise<null> => http.post<null>("/auth/logout"),
};

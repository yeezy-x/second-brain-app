import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/features/auth/api/auth-api";
import type { SignupRequest } from "@/features/auth/types";

export function useSignup() {
  return useMutation({
    mutationFn: (body: SignupRequest) => authApi.signup(body),
  });
}

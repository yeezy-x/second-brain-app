import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/features/auth/api/auth-api";
import { useAuthStore } from "@/store/auth-store";
import type { LoginRequest } from "@/features/auth/types";

export function useLogin() {
  const setTokens = useAuthStore((s) => s.setTokens);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: (tokens, variables) => {
      setTokens({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        email: variables.email,
      });
      queryClient.clear();
    },
  });
}

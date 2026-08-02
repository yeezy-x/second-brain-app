import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/features/auth/api/auth-api";
import { useAuthStore } from "@/store/auth-store";
import type { SignupRequest } from "@/features/auth/types";

export function useSignup() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: SignupRequest) => authApi.signup(body),
    onSuccess: (user) => {
      setUser(user);
      queryClient.clear();
    },
  });
}

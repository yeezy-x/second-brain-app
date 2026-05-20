import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/features/auth/api/auth-api";
import { useAuthStore } from "@/store/auth-store";

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    // Even if the server-side logout fails (e.g., expired session), the
    // client should still drop credentials and reset cached server data.
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });
}

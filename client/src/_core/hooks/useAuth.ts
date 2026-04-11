import { trpc } from "@/lib/trpc";

export function useAuth() {
  const utils = trpc.useUtils();

  const query = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    },
  });

  return {
    user: query.data ?? null,
    isAuthenticated: !!query.data,
    loading: query.isLoading,
    refetch: query.refetch,
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
    isLoggingOut: logoutMutation.isPending,
  };
}
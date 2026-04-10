import { trpc } from "@/lib/trpc";

export function useAuth() {
  const query = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    user: query.data ?? null,
    isAuthenticated: !!query.data,
    loading: query.isLoading,
    refetch: query.refetch,
  };
}
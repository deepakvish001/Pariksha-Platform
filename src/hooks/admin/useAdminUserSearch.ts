import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminUserHit {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export const useAdminUserSearch = (q: string, limit = 20) =>
  useQuery({
    queryKey: ["admin-user-search", q, limit],
    enabled: q.trim().length >= 2 || /^[0-9a-f-]{36}$/i.test(q.trim()),
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("admin_search_users", {
        _q: q.trim(),
        _limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as AdminUserHit[];
    },
  });

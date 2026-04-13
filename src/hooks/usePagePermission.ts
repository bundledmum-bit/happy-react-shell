import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "./useAdmin";

/**
 * Check a single permission via the DB RPC.
 * Returns { allowed, loading }.
 */
export function usePagePermission(module: string, action: string) {
  const { user } = useAdmin();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-permission", user?.id, module, action],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_admin_permission", {
        p_section: module,
        p_action: action,
      });
      if (error) throw error;
      return data as boolean;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  return { allowed: data ?? false, loading: isLoading || !user };
}

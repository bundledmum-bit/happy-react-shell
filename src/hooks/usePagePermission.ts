import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "./useAdminPermissionsContext";

/**
 * Calls the has_admin_permission RPC to check page-level access.
 * Super admin and admin roles bypass the check entirely.
 */
export function usePagePermission(section: string, action: string) {
  const { adminUser, loading: permLoading } = usePermissions();

  const isBypass = adminUser?.role === "super_admin" || adminUser?.role === "admin";

  const { data: allowed, isLoading: rpcLoading } = useQuery({
    queryKey: ["page-permission", section, action, adminUser?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_admin_permission", {
        p_section: section,
        p_action: action,
      });
      if (error) {
        console.error("Permission check failed:", error);
        return false;
      }
      return data === true;
    },
    enabled: !!adminUser && !isBypass,
    staleTime: 60000,
  });

  if (permLoading) return { loading: true, allowed: false };
  if (!adminUser) return { loading: false, allowed: false };
  if (isBypass) return { loading: false, allowed: true };

  return {
    loading: rpcLoading,
    allowed: allowed === true,
  };
}

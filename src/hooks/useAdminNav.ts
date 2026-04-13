import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "./useAdmin";

export interface AdminNavItem {
  nav_key: string;
  label: string;
  icon: string | null;
  path: string;
  parent_key: string | null;
  display_order: number;
}

export function useAdminNav() {
  const { user } = useAdmin();

  return useQuery<AdminNavItem[]>({
    queryKey: ["admin-nav", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_nav");
      if (error) throw error;
      return (data || []) as unknown as AdminNavItem[];
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

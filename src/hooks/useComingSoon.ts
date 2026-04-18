import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ComingSoonFlags {
  enabled: boolean;
  redirectAll: boolean;
}

function coerceBool(v: any): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

/** Fetches the two public-facing Coming Soon flags. Cached for the session. */
export function useComingSoonFlags() {
  return useQuery<ComingSoonFlags>({
    queryKey: ["coming_soon_flags"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["coming_soon_enabled", "coming_soon_redirect_all"]);
      const map: Record<string, any> = {};
      (data || []).forEach((r: any) => { map[r.key] = r.value; });
      return {
        enabled: coerceBool(map.coming_soon_enabled),
        redirectAll: coerceBool(map.coming_soon_redirect_all),
      };
    },
    staleTime: 60_000,
  });
}

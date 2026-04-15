import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PageRow {
  id: string;
  slug: string;
  title: string;
  content: string;
  hero_text: string | null;
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch a single published page from the `pages` table by slug.
 * Returns null if no row matches or the row is unpublished.
 */
export function usePage(slug: string | undefined) {
  return useQuery<PageRow | null>({
    queryKey: ["page", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug as string)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return (data as PageRow | null) ?? null;
    },
  });
}

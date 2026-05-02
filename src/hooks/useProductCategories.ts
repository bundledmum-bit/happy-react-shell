import { useQuery } from "@tanstack/react-query";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
// merch_page_label is a recent column not yet in generated types.
const supabase = supabaseTyped as any;

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parent_category: string | null;
  display_order: number;
  icon: string | null;
  is_active: boolean;
  stage_order?: number | null;
  merch_page_label?: string | null;
}

export function useProductCategories() {
  return useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("id, name, slug, parent_category, display_order, icon, is_active, stage_order, merch_page_label")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as ProductCategory[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

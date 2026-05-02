import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  parent_category: string | null;
  display_order: number;
  icon: string | null;
  is_active: boolean;
  stage_order?: number | null;
}

export function useProductCategories() {
  return useQuery({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as ProductCategory[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase as supabaseTyped } from "@/integrations/supabase/client";
// The merchandising tables aren't in the generated types yet; cast the
// client so TS doesn't reject the new table names. Behaviour is unchanged.
const supabase = supabaseTyped as any;
import { adaptProducts, type Product } from "@/lib/supabaseAdapters";

const STALE_5MIN = 5 * 60 * 1000;

const BRAND_COLS =
  "id, product_id, brand_name, price, tier, is_default_for_tier, size_variant, in_stock, stock_quantity, display_order, image_url, thumbnail_url, logo_url, compare_at_price, images, cost_price, weight_range_kg, pack_count, diaper_type, sku";

const PRODUCT_COLS =
  `*, brands(${BRAND_COLS}), product_sizes(*), product_colors(*), product_tags(*), product_images(*)`;

export type ShopVariant = "all" | "baby" | "mum";

export interface MerchSection {
  id: string;
  shop: ShopVariant;
  category_slug: string;
  section_order: number;
  is_active: boolean;
  section_label: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    stage_order: number | null;
  } | null;
}

export interface MerchSectionProductRow {
  id: string;
  shop: ShopVariant;
  category_slug: string;
  product_id: string;
  product_order: number;
  is_active: boolean;
}

/**
 * Sections for a given shop variant, joined to the category for icon/name.
 * Ordered by section_order. Inactive sections are filtered out for the
 * storefront — admin reads should pass `includeInactive=true`.
 */
export function useShopSections(shop: ShopVariant, includeInactive = false) {
  return useQuery({
    queryKey: ["merch_shop_sections", shop, includeInactive],
    queryFn: async () => {
      let q = supabase
        .from("merch_shop_sections")
        .select(
          "id, shop, category_slug, section_order, is_active, section_label, " +
          "product_categories!merch_shop_sections_category_slug_fkey(id, name, slug, icon, stage_order)"
        )
        .eq("shop", shop)
        .order("section_order");
      if (!includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...row,
        category: row.product_categories || null,
      })) as MerchSection[];
    },
    staleTime: STALE_5MIN,
  });
}

/**
 * Curated product list for a section. Returns adapted Product[]. Caller
 * should fall back to useFallbackSectionProducts when this returns empty.
 */
export function useSectionProducts(shop: ShopVariant, categorySlug: string, limit = 10) {
  return useQuery({
    queryKey: ["merch_section_products", shop, categorySlug, limit],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("merch_section_products")
        .select(`id, product_id, product_order, is_active, products(${PRODUCT_COLS})`)
        .eq("shop", shop)
        .eq("category_slug", categorySlug)
        .eq("is_active", true)
        .order("product_order")
        .limit(limit);
      if (error) throw error;
      const productRows = (rows || [])
        .map((r: any) => r.products)
        .filter((p: any) => p && p.is_active && !p.deleted_at);
      return adaptProducts(productRows) as Product[];
    },
    staleTime: STALE_5MIN,
    enabled: !!shop && !!categorySlug,
  });
}

/**
 * Fallback when the curated list is empty — most-recent products in the
 * subcategory, capped at 10. Adapted Product[].
 */
export function useFallbackSectionProducts(categorySlug: string, limit = 10) {
  return useQuery({
    queryKey: ["merch_fallback_products", categorySlug, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_COLS)
        .eq("subcategory", categorySlug)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return adaptProducts(data || []) as Product[];
    },
    staleTime: STALE_5MIN,
    enabled: !!categorySlug,
  });
}

/**
 * Admin-only: every row in merch_section_products for a shop+slug, with
 * the joined product. Used by the merchandising admin to render the
 * editable list (so removing one product doesn't require optimistic UI).
 */
export function useAdminSectionProducts(shop: ShopVariant, categorySlug: string, enabled = true) {
  return useQuery({
    queryKey: ["admin_merch_section_products", shop, categorySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merch_section_products")
        .select(`id, product_id, product_order, is_active, products(id, name, emoji, image_url, subcategory, is_active, deleted_at)`)
        .eq("shop", shop)
        .eq("category_slug", categorySlug)
        .order("product_order");
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000,
    enabled,
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
      // products!inner forces PostgREST to drop curated rows whose joined
      // product is missing/filtered, and the embedded `.eq/.is` filters push
      // is_active/deleted_at down to the joined table BEFORE limit applies.
      // Without this, an inactive product would still consume one of the
      // `limit` slots and we'd silently render fewer cards.
      const { data: rows, error } = await supabase
        .from("merch_section_products")
        .select(`id, product_id, product_order, is_active, products!inner(${PRODUCT_COLS})`)
        .eq("shop", shop)
        .eq("category_slug", categorySlug)
        .eq("is_active", true)
        .eq("products.is_active", true)
        .is("products.deleted_at", null)
        .order("product_order")
        .limit(limit);
      if (error) throw error;
      // JS-side belt-and-braces: even if the embedded filter were ever
      // bypassed, never let an inactive product through.
      const productRows = (rows || [])
        .map((r: any) => r.products)
        .filter((p: any) => p && p.is_active !== false && !p.deleted_at);
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
 * Popularity-ranked categories for a shop variant.
 *
 * Popularity = SUM(order_items.quantity) per products.subcategory over the
 * last 180 days. Categories with zero active products are filtered out.
 * Tie-break is `stage_order` ASC. Returned shape matches what the section
 * renderer needs (slug, name, icon, parent_category, stage_order).
 *
 * The query is intentionally client-side aggregated — keeps us off RPCs
 * that may not exist yet, and the dataset (orders × items) is small enough
 * for that to be fine. Cached 5 min via TanStack Query.
 */
export interface PopularCategory {
  slug: string;
  name: string;
  icon: string | null;
  parent_category: string | null;
  stage_order: number | null;
  popularity: number;
}

export function usePopularCategories(shop: ShopVariant) {
  return useQuery<PopularCategory[]>({
    queryKey: ["popular_categories", shop],
    queryFn: async () => {
      const sinceIso = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch order items in the window. Paginate defensively in 1000-row pages.
      const orderItems: Array<{ product_id: string; quantity: number }> = [];
      const PAGE = 1000;
      let from = 0;
      // Hard cap to avoid runaway loops on bad data.
      for (let i = 0; i < 50; i++) {
        const { data, error } = await supabase
          .from("order_items")
          .select("product_id, quantity, created_at")
          .gte("created_at", sinceIso)
          .range(from, from + PAGE - 1);
        if (error) throw error;
        const rows = data || [];
        orderItems.push(...rows.map((r: any) => ({ product_id: r.product_id, quantity: Number(r.quantity) || 0 })));
        if (rows.length < PAGE) break;
        from += PAGE;
      }

      // All active products → product_id → subcategory map.
      const { data: products, error: pErr } = await supabase
        .from("products")
        .select("id, subcategory, is_active, deleted_at")
        .eq("is_active", true)
        .is("deleted_at", null);
      if (pErr) throw pErr;
      const productSubcat = new Map<string, string>();
      const subcatActiveCount = new Map<string, number>();
      for (const p of (products || []) as any[]) {
        if (!p.subcategory) continue;
        productSubcat.set(p.id, p.subcategory);
        subcatActiveCount.set(p.subcategory, (subcatActiveCount.get(p.subcategory) || 0) + 1);
      }

      // Aggregate popularity per subcategory.
      const popularity = new Map<string, number>();
      for (const oi of orderItems) {
        const slug = productSubcat.get(oi.product_id);
        if (!slug) continue;
        popularity.set(slug, (popularity.get(slug) || 0) + oi.quantity);
      }

      // All active categories.
      const { data: cats, error: cErr } = await supabase
        .from("product_categories")
        .select("slug, name, icon, parent_category, stage_order, is_active")
        .eq("is_active", true);
      if (cErr) throw cErr;

      let filtered = (cats || []) as any[];
      if (shop === "baby") {
        filtered = filtered.filter(c => c.parent_category === "baby" || c.parent_category === "both");
      } else if (shop === "mum") {
        filtered = filtered.filter(c => c.parent_category === "mum" || c.parent_category === "both");
      }
      // Skip empty categories.
      filtered = filtered.filter(c => (subcatActiveCount.get(c.slug) || 0) > 0);

      const ranked: PopularCategory[] = filtered.map(c => ({
        slug: c.slug,
        name: c.name,
        icon: c.icon ?? null,
        parent_category: c.parent_category ?? null,
        stage_order: c.stage_order ?? null,
        popularity: popularity.get(c.slug) || 0,
      }));

      ranked.sort((a, b) => {
        if (b.popularity !== a.popularity) return b.popularity - a.popularity;
        const sa = a.stage_order ?? 9999;
        const sb = b.stage_order ?? 9999;
        return sa - sb;
      });

      return ranked;
    },
    staleTime: STALE_5MIN,
  });
}

/**
 * Admin-only: every row in merch_section_products for a shop+slug, with
 * the joined product. Used by the merchandising admin to render the
 * editable list (so removing one product doesn't require optimistic UI).
 */
// ----------------------------------------------------------------------------
// Category-page pins — drives /shop/[category-slug]
// ----------------------------------------------------------------------------

const CATEGORY_PINS_KEY = (categorySlug: string) => ["merch_category_page_pins", categorySlug] as const;
const CATEGORY_PINS_ADMIN_KEY = (categorySlug: string) => ["merch_category_page_pins_admin", categorySlug] as const;

/**
 * Storefront: pinned products for a category page, ordered. Mirrors the
 * `useSectionProducts` join pattern with embedded filters on the products
 * row plus a JS belt-and-braces filter so an inactive product can never
 * leak through.
 */
export function useCategoryPagePins(categorySlug: string) {
  return useQuery({
    queryKey: CATEGORY_PINS_KEY(categorySlug),
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("merch_category_products")
        .select(`id, product_id, product_order, is_active, products!inner(${PRODUCT_COLS})`)
        .eq("category_slug", categorySlug)
        .eq("is_active", true)
        .eq("products.is_active", true)
        .is("products.deleted_at", null)
        .order("product_order");
      if (error) throw error;
      const productRows = (rows || [])
        .map((r: any) => r.products)
        .filter((p: any) => p && p.is_active !== false && !p.deleted_at);
      return adaptProducts(productRows) as Product[];
    },
    staleTime: STALE_5MIN,
    enabled: !!categorySlug,
  });
}

/**
 * Admin variant: every row regardless of `is_active` so admins see
 * deactivated pins too. (Currently used by the merchandising admin tab.)
 */
export function useCategoryPagePinsAdmin(categorySlug: string, enabled = true) {
  return useQuery({
    queryKey: CATEGORY_PINS_ADMIN_KEY(categorySlug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merch_category_products")
        .select(`id, product_id, product_order, is_active, products(id, name, emoji, image_url, subcategory, is_active, deleted_at)`)
        .eq("category_slug", categorySlug)
        .order("product_order");
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000,
    enabled: enabled && !!categorySlug,
  });
}

function invalidateCategoryPins(qc: ReturnType<typeof useQueryClient>, categorySlug: string) {
  qc.invalidateQueries({ queryKey: CATEGORY_PINS_KEY(categorySlug) });
  qc.invalidateQueries({ queryKey: CATEGORY_PINS_ADMIN_KEY(categorySlug) });
}

export function useAddCategoryPagePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      categorySlug, productId, productOrder,
    }: { categorySlug: string; productId: string; productOrder: number }) => {
      const { error } = await supabase.from("merch_category_products").insert({
        category_slug: categorySlug,
        product_id: productId,
        product_order: productOrder,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => invalidateCategoryPins(qc, vars.categorySlug),
  });
}

export function useRemoveCategoryPagePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; categorySlug: string }) => {
      const { error } = await supabase.from("merch_category_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => invalidateCategoryPins(qc, vars.categorySlug),
  });
}

export function useToggleCategoryPagePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean; categorySlug: string }) => {
      const { error } = await supabase
        .from("merch_category_products")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => invalidateCategoryPins(qc, vars.categorySlug),
  });
}

/**
 * Reorder pins by swapping a pair. Two-step swap pattern (write -1 first)
 * to avoid the (category_slug, product_order) — well, there isn't a unique
 * on order, but we mirror the pattern used elsewhere for safety.
 *
 * Accepts `[a, b]` — the two rows to swap orders for.
 */
export function useReorderCategoryPagePins() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      a, b,
    }: { a: { id: string; product_order: number }; b: { id: string; product_order: number }; categorySlug: string }) => {
      const { error: e1 } = await supabase.from("merch_category_products").update({ product_order: -1 }).eq("id", a.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("merch_category_products").update({ product_order: a.product_order }).eq("id", b.id);
      if (e2) throw e2;
      const { error: e3 } = await supabase.from("merch_category_products").update({ product_order: b.product_order }).eq("id", a.id);
      if (e3) throw e3;
    },
    onSuccess: (_d, vars) => invalidateCategoryPins(qc, vars.categorySlug),
  });
}

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

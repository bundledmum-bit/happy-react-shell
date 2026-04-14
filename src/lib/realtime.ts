import { supabase } from "@/integrations/supabase/client";

// Tables safe for anon/public realtime (still in supabase_realtime publication)
const PUBLIC_TABLES = new Set([
  "products", "brands", "product_sizes", "product_colors", "product_tags",
  "product_images", "bundles", "bundle_items", "delivery_settings",
  "site_settings", "testimonials", "faq_items", "blog_posts",
  "navigation_links", "homepage_sections", "pages",
  "product_categories", "spend_threshold_discounts",
  "shipping_zones", "announcements",
]);

const TABLE_TO_QUERY_KEYS: Record<string, string[]> = {
  products: ["products", "admin-products", "admin-inventory"],
  brands: ["products", "admin-products", "admin-inventory", "bundles"],
  product_sizes: ["products", "admin-products"],
  product_colors: ["products", "admin-products"],
  product_tags: ["products", "admin-products"],
  bundles: ["bundles", "admin-bundles"],
  bundle_items: ["bundles", "admin-bundles"],
  delivery_settings: ["delivery_settings", "admin-delivery", "shipping-zones"],
  site_settings: ["site_settings", "admin-settings"],
  testimonials: ["testimonials", "admin-testimonials"],
  faq_items: ["faq_items", "admin-faqs"],
  blog_posts: ["blog_posts", "admin-blog"],
  referral_codes: ["referral_code"],
  orders: ["admin-orders", "admin-stats", "analytics-orders", "admin-customers"],
  order_items: ["admin-orders"],
  admin_notifications: ["admin-notifications"],
  product_images: ["product-images", "products", "admin-products"],
  coupons: ["admin-coupons", "coupons"],
  customers: ["admin-customers"],
  shipping_zones: ["admin-shipping-zones", "shipping-zones"],
  order_notes: ["admin-order-notes"],
  order_status_history: ["admin-order-history"],
  navigation_links: ["navigation-links"],
  homepage_sections: ["homepage-sections"],
  pages: ["admin-pages", "pages"],
  spend_threshold_discounts: ["spend-thresholds", "admin-spend-thresholds"],
  product_categories: ["product-categories", "admin-product-categories"],
};

/**
 * Subscribe to realtime changes on PUBLIC tables only (safe for anon client).
 * Used by the storefront RealtimeProvider.
 */
export function subscribeToAllChanges(onUpdate: (table: string, queryKeys: string[]) => void) {
  const channel = supabase
    .channel("storefront-sync")
    .on("postgres_changes", { event: "*", schema: "public" }, (payload) => {
      const table = payload.table;
      // Only process public tables — sensitive ones are no longer in the publication
      if (!PUBLIC_TABLES.has(table)) return;
      const keys = TABLE_TO_QUERY_KEYS[table] || [table];
      onUpdate(table, keys);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export { TABLE_TO_QUERY_KEYS };

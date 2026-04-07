import { supabase } from "@/integrations/supabase/client";

const REALTIME_TABLES = [
  "products", "brands", "product_sizes", "product_colors", "product_tags",
  "bundles", "bundle_items", "delivery_settings", "site_settings",
  "testimonials", "faq_items", "blog_posts", "referral_codes",
  "orders", "admin_notifications", "product_images",
];

const TABLE_TO_QUERY_KEYS: Record<string, string[]> = {
  products: ["products", "admin-products"],
  brands: ["products", "admin-products"],
  product_sizes: ["products", "admin-products"],
  product_colors: ["products", "admin-products"],
  product_tags: ["products", "admin-products"],
  bundles: ["bundles", "admin-bundles"],
  bundle_items: ["bundles", "admin-bundles"],
  delivery_settings: ["delivery_settings"],
  site_settings: ["site_settings"],
  testimonials: ["testimonials", "admin-testimonials"],
  faq_items: ["faq_items", "admin-faqs"],
  blog_posts: ["blog_posts", "admin-blog"],
  referral_codes: ["referral_code"],
  orders: ["admin-orders", "admin-stats"],
  admin_notifications: ["admin-notifications"],
  product_images: ["product-images", "products"],
};

export function subscribeToAllChanges(onUpdate: (table: string, queryKeys: string[]) => void) {
  const channel = supabase
    .channel("storefront-sync")
    .on("postgres_changes", { event: "*", schema: "public" }, (payload) => {
      const table = payload.table;
      const keys = TABLE_TO_QUERY_KEYS[table] || [table];
      onUpdate(table, keys);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

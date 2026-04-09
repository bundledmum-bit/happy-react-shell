import { supabase } from "@/integrations/supabase/client";

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

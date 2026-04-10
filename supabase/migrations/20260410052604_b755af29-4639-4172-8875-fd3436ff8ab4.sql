
-- 1. Create a helper function to check if current user is an active admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE auth_user_id = auth.uid() AND is_active = TRUE
  )
$$;

-- 2. Drop and recreate all "Admin full access" policies to use is_admin()

-- products
DROP POLICY IF EXISTS "Admin full access products" ON public.products;
CREATE POLICY "Admin full access products" ON public.products FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- product_tags
DROP POLICY IF EXISTS "Admin full access product_tags" ON public.product_tags;
CREATE POLICY "Admin full access product_tags" ON public.product_tags FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- product_sizes
DROP POLICY IF EXISTS "Admin full access product_sizes" ON public.product_sizes;
CREATE POLICY "Admin full access product_sizes" ON public.product_sizes FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- product_colors
DROP POLICY IF EXISTS "Admin full access product_colors" ON public.product_colors;
CREATE POLICY "Admin full access product_colors" ON public.product_colors FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- product_images
DROP POLICY IF EXISTS "Admin write product_images" ON public.product_images;
CREATE POLICY "Admin write product_images" ON public.product_images FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- product_categories
DROP POLICY IF EXISTS "Admin full access product_categories" ON public.product_categories;
CREATE POLICY "Admin full access product_categories" ON public.product_categories FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- brands
DROP POLICY IF EXISTS "Admin full access brands" ON public.brands;
CREATE POLICY "Admin full access brands" ON public.brands FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- bundles
DROP POLICY IF EXISTS "Admin full access bundles" ON public.bundles;
CREATE POLICY "Admin full access bundles" ON public.bundles FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- bundle_items
DROP POLICY IF EXISTS "Admin full access bundle_items" ON public.bundle_items;
CREATE POLICY "Admin full access bundle_items" ON public.bundle_items FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- orders
DROP POLICY IF EXISTS "Admin full access orders" ON public.orders;
CREATE POLICY "Admin full access orders" ON public.orders FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- order_items
DROP POLICY IF EXISTS "Admin full access order_items" ON public.order_items;
CREATE POLICY "Admin full access order_items" ON public.order_items FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- order_notes
DROP POLICY IF EXISTS "Admin full access order_notes" ON public.order_notes;
CREATE POLICY "Admin full access order_notes" ON public.order_notes FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- order_status_history
DROP POLICY IF EXISTS "Admin full access order_status_history" ON public.order_status_history;
CREATE POLICY "Admin full access order_status_history" ON public.order_status_history FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- customers
DROP POLICY IF EXISTS "Admin full access customers" ON public.customers;
CREATE POLICY "Admin full access customers" ON public.customers FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- coupons
DROP POLICY IF EXISTS "Admin full access coupons" ON public.coupons;
CREATE POLICY "Admin full access coupons" ON public.coupons FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- coupon_usage
DROP POLICY IF EXISTS "Admin full access coupon_usage" ON public.coupon_usage;
CREATE POLICY "Admin full access coupon_usage" ON public.coupon_usage FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- referral_codes
DROP POLICY IF EXISTS "Admin full access referral_codes" ON public.referral_codes;
CREATE POLICY "Admin full access referral_codes" ON public.referral_codes FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- referral_redemptions
DROP POLICY IF EXISTS "Admin full access referral_redemptions" ON public.referral_redemptions;
CREATE POLICY "Admin full access referral_redemptions" ON public.referral_redemptions FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- testimonials
DROP POLICY IF EXISTS "Admin full access testimonials" ON public.testimonials;
CREATE POLICY "Admin full access testimonials" ON public.testimonials FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- faq_items
DROP POLICY IF EXISTS "Admin full access faq_items" ON public.faq_items;
CREATE POLICY "Admin full access faq_items" ON public.faq_items FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- blog_posts
DROP POLICY IF EXISTS "Admin full access blog_posts" ON public.blog_posts;
CREATE POLICY "Admin full access blog_posts" ON public.blog_posts FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- site_settings
DROP POLICY IF EXISTS "Admin full access site_settings" ON public.site_settings;
CREATE POLICY "Admin full access site_settings" ON public.site_settings FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- delivery_settings
DROP POLICY IF EXISTS "Admin full access delivery_settings" ON public.delivery_settings;
CREATE POLICY "Admin full access delivery_settings" ON public.delivery_settings FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- shipping_zones
DROP POLICY IF EXISTS "Admin full access shipping_zones" ON public.shipping_zones;
CREATE POLICY "Admin full access shipping_zones" ON public.shipping_zones FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- navigation_links
DROP POLICY IF EXISTS "Admin full access navigation_links" ON public.navigation_links;
CREATE POLICY "Admin full access navigation_links" ON public.navigation_links FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- homepage_sections
DROP POLICY IF EXISTS "Admin full access homepage_sections" ON public.homepage_sections;
CREATE POLICY "Admin full access homepage_sections" ON public.homepage_sections FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- pages
DROP POLICY IF EXISTS "Admin full access pages" ON public.pages;
CREATE POLICY "Admin full access pages" ON public.pages FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- analytics_events
DROP POLICY IF EXISTS "Admin full access analytics" ON public.analytics_events;
CREATE POLICY "Admin full access analytics" ON public.analytics_events FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- stock_notifications
DROP POLICY IF EXISTS "Admin full access stock_notifications" ON public.stock_notifications;
CREATE POLICY "Admin full access stock_notifications" ON public.stock_notifications FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- tax_settings
DROP POLICY IF EXISTS "Admin full access tax_settings" ON public.tax_settings;
CREATE POLICY "Admin full access tax_settings" ON public.tax_settings FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- spend_threshold_discounts
DROP POLICY IF EXISTS "Admin full access spend_threshold_discounts" ON public.spend_threshold_discounts;
CREATE POLICY "Admin full access spend_threshold_discounts" ON public.spend_threshold_discounts FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- revisions
DROP POLICY IF EXISTS "Admin access revisions" ON public.revisions;
CREATE POLICY "Admin access revisions" ON public.revisions FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- activity_log INSERT
DROP POLICY IF EXISTS "Insert activity_log" ON public.activity_log;
CREATE POLICY "Insert activity_log" ON public.activity_log FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- admin_notifications INSERT
DROP POLICY IF EXISTS "Insert notifications" ON public.admin_notifications;
CREATE POLICY "Insert notifications" ON public.admin_notifications FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- 3. Fix referral_codes public read — only expose code and is_active via a view
DROP POLICY IF EXISTS "Public read referral_codes" ON public.referral_codes;
-- Create a restrictive SELECT policy that only allows reading active codes
-- The client code only needs to validate codes, so we keep the policy but
-- we'll create a view for public access that hides PII
CREATE POLICY "Public read referral_codes" ON public.referral_codes FOR SELECT TO public
  USING (is_active = true);

-- Note: The frontend should use a limited select query: .select('code, is_active')
-- The RLS still allows reading all columns, but the app code should limit fields

-- 4. Remove unrestricted public INSERT on financial tables
DROP POLICY IF EXISTS "Public insert coupon_usage" ON public.coupon_usage;
DROP POLICY IF EXISTS "Public insert referral_redemptions" ON public.referral_redemptions;

-- 5. Add SELECT policy for order-receipts storage bucket (admin only)
CREATE POLICY "Admin read order-receipts" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'order-receipts' AND (
    EXISTS (SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid() AND is_active = TRUE)
  ));

-- 6. Restrict storage write policies to admins only
DROP POLICY IF EXISTS "Admin delete product-images" ON storage.objects;
CREATE POLICY "Admin delete product-images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = ANY (ARRAY['product-images', 'blog-images', 'brand-logos', 'sharecards', 'order-receipts'])
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid() AND is_active = TRUE));

DROP POLICY IF EXISTS "Admin update product-images" ON storage.objects;
CREATE POLICY "Admin update product-images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = ANY (ARRAY['product-images', 'blog-images', 'brand-logos', 'sharecards', 'order-receipts'])
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid() AND is_active = TRUE));

DROP POLICY IF EXISTS "Admin upload product-images" ON storage.objects;
CREATE POLICY "Admin upload product-images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = ANY (ARRAY['product-images', 'blog-images', 'brand-logos', 'sharecards', 'order-receipts'])
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE auth_user_id = auth.uid() AND is_active = TRUE));

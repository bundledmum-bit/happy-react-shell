
-- ============================================================
-- 1. Replace is_admin() with has_admin_permission() on all tables
-- ============================================================

-- PRODUCTS
DROP POLICY IF EXISTS "Admin full access products" ON public.products;
CREATE POLICY "Admin read products" ON public.products FOR SELECT TO authenticated USING (has_admin_permission('products', 'view'));
CREATE POLICY "Admin insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (has_admin_permission('products', 'create'));
CREATE POLICY "Admin update products" ON public.products FOR UPDATE TO authenticated USING (has_admin_permission('products', 'edit')) WITH CHECK (has_admin_permission('products', 'edit'));
CREATE POLICY "Admin delete products" ON public.products FOR DELETE TO authenticated USING (has_admin_permission('products', 'delete'));

-- BRANDS
DROP POLICY IF EXISTS "Admin full access brands" ON public.brands;
CREATE POLICY "Admin read brands" ON public.brands FOR SELECT TO authenticated USING (has_admin_permission('products', 'view'));
CREATE POLICY "Admin insert brands" ON public.brands FOR INSERT TO authenticated WITH CHECK (has_admin_permission('products', 'create'));
CREATE POLICY "Admin update brands" ON public.brands FOR UPDATE TO authenticated USING (has_admin_permission('products', 'edit')) WITH CHECK (has_admin_permission('products', 'edit'));
CREATE POLICY "Admin delete brands" ON public.brands FOR DELETE TO authenticated USING (has_admin_permission('products', 'delete'));

-- PRODUCT_SIZES
DROP POLICY IF EXISTS "Admin full access product_sizes" ON public.product_sizes;
CREATE POLICY "Admin read product_sizes" ON public.product_sizes FOR SELECT TO authenticated USING (has_admin_permission('products', 'view'));
CREATE POLICY "Admin write product_sizes" ON public.product_sizes FOR INSERT TO authenticated WITH CHECK (has_admin_permission('products', 'create'));
CREATE POLICY "Admin update product_sizes" ON public.product_sizes FOR UPDATE TO authenticated USING (has_admin_permission('products', 'edit'));
CREATE POLICY "Admin delete product_sizes" ON public.product_sizes FOR DELETE TO authenticated USING (has_admin_permission('products', 'delete'));

-- PRODUCT_COLORS
DROP POLICY IF EXISTS "Admin full access product_colors" ON public.product_colors;
CREATE POLICY "Admin read product_colors" ON public.product_colors FOR SELECT TO authenticated USING (has_admin_permission('products', 'view'));
CREATE POLICY "Admin write product_colors" ON public.product_colors FOR INSERT TO authenticated WITH CHECK (has_admin_permission('products', 'create'));
CREATE POLICY "Admin update product_colors" ON public.product_colors FOR UPDATE TO authenticated USING (has_admin_permission('products', 'edit'));
CREATE POLICY "Admin delete product_colors" ON public.product_colors FOR DELETE TO authenticated USING (has_admin_permission('products', 'delete'));

-- PRODUCT_TAGS
DROP POLICY IF EXISTS "Admin full access product_tags" ON public.product_tags;
CREATE POLICY "Admin read product_tags" ON public.product_tags FOR SELECT TO authenticated USING (has_admin_permission('products', 'view'));
CREATE POLICY "Admin write product_tags" ON public.product_tags FOR INSERT TO authenticated WITH CHECK (has_admin_permission('products', 'create'));
CREATE POLICY "Admin update product_tags" ON public.product_tags FOR UPDATE TO authenticated USING (has_admin_permission('products', 'edit'));
CREATE POLICY "Admin delete product_tags" ON public.product_tags FOR DELETE TO authenticated USING (has_admin_permission('products', 'delete'));

-- PRODUCT_IMAGES
DROP POLICY IF EXISTS "Admin write product_images" ON public.product_images;
CREATE POLICY "Admin read product_images" ON public.product_images FOR SELECT TO authenticated USING (has_admin_permission('products', 'view'));
CREATE POLICY "Admin insert product_images" ON public.product_images FOR INSERT TO authenticated WITH CHECK (has_admin_permission('products', 'create'));
CREATE POLICY "Admin update product_images" ON public.product_images FOR UPDATE TO authenticated USING (has_admin_permission('products', 'edit'));
CREATE POLICY "Admin delete product_images" ON public.product_images FOR DELETE TO authenticated USING (has_admin_permission('products', 'delete'));

-- PRODUCT_CATEGORIES
DROP POLICY IF EXISTS "Admin full access product_categories" ON public.product_categories;
CREATE POLICY "Admin read product_categories" ON public.product_categories FOR SELECT TO authenticated USING (has_admin_permission('products', 'view'));
CREATE POLICY "Admin write product_categories" ON public.product_categories FOR INSERT TO authenticated WITH CHECK (has_admin_permission('products', 'create'));
CREATE POLICY "Admin update product_categories" ON public.product_categories FOR UPDATE TO authenticated USING (has_admin_permission('products', 'edit'));
CREATE POLICY "Admin delete product_categories" ON public.product_categories FOR DELETE TO authenticated USING (has_admin_permission('products', 'delete'));

-- BUNDLES
DROP POLICY IF EXISTS "Admin full access bundles" ON public.bundles;
CREATE POLICY "Admin read bundles" ON public.bundles FOR SELECT TO authenticated USING (has_admin_permission('bundles', 'view'));
CREATE POLICY "Admin insert bundles" ON public.bundles FOR INSERT TO authenticated WITH CHECK (has_admin_permission('bundles', 'create'));
CREATE POLICY "Admin update bundles" ON public.bundles FOR UPDATE TO authenticated USING (has_admin_permission('bundles', 'edit')) WITH CHECK (has_admin_permission('bundles', 'edit'));
CREATE POLICY "Admin delete bundles" ON public.bundles FOR DELETE TO authenticated USING (has_admin_permission('bundles', 'delete'));

-- BUNDLE_ITEMS
DROP POLICY IF EXISTS "Admin full access bundle_items" ON public.bundle_items;
CREATE POLICY "Admin read bundle_items" ON public.bundle_items FOR SELECT TO authenticated USING (has_admin_permission('bundles', 'view'));
CREATE POLICY "Admin write bundle_items" ON public.bundle_items FOR INSERT TO authenticated WITH CHECK (has_admin_permission('bundles', 'create'));
CREATE POLICY "Admin update bundle_items" ON public.bundle_items FOR UPDATE TO authenticated USING (has_admin_permission('bundles', 'edit'));
CREATE POLICY "Admin delete bundle_items" ON public.bundle_items FOR DELETE TO authenticated USING (has_admin_permission('bundles', 'delete'));

-- ORDERS
DROP POLICY IF EXISTS "Admin full access orders" ON public.orders;
CREATE POLICY "Admin read orders" ON public.orders FOR SELECT TO authenticated USING (has_admin_permission('orders', 'view'));
CREATE POLICY "Admin update orders" ON public.orders FOR UPDATE TO authenticated USING (has_admin_permission('orders', 'edit')) WITH CHECK (has_admin_permission('orders', 'edit'));
CREATE POLICY "Admin delete orders" ON public.orders FOR DELETE TO authenticated USING (has_admin_permission('orders', 'delete'));

-- ORDER_ITEMS
DROP POLICY IF EXISTS "Admin full access order_items" ON public.order_items;
CREATE POLICY "Admin read order_items" ON public.order_items FOR SELECT TO authenticated USING (has_admin_permission('orders', 'view'));
CREATE POLICY "Admin update order_items" ON public.order_items FOR UPDATE TO authenticated USING (has_admin_permission('orders', 'edit'));
CREATE POLICY "Admin delete order_items" ON public.order_items FOR DELETE TO authenticated USING (has_admin_permission('orders', 'delete'));

-- ORDER_NOTES
DROP POLICY IF EXISTS "Admin full access order_notes" ON public.order_notes;
CREATE POLICY "Admin read order_notes" ON public.order_notes FOR SELECT TO authenticated USING (has_admin_permission('orders', 'view'));
CREATE POLICY "Admin insert order_notes" ON public.order_notes FOR INSERT TO authenticated WITH CHECK (has_admin_permission('orders', 'edit'));
CREATE POLICY "Admin update order_notes" ON public.order_notes FOR UPDATE TO authenticated USING (has_admin_permission('orders', 'edit'));
CREATE POLICY "Admin delete order_notes" ON public.order_notes FOR DELETE TO authenticated USING (has_admin_permission('orders', 'delete'));

-- ORDER_STATUS_HISTORY
DROP POLICY IF EXISTS "Admin full access order_status_history" ON public.order_status_history;
CREATE POLICY "Admin read order_status_history" ON public.order_status_history FOR SELECT TO authenticated USING (has_admin_permission('orders', 'view'));
CREATE POLICY "Admin insert order_status_history" ON public.order_status_history FOR INSERT TO authenticated WITH CHECK (has_admin_permission('orders', 'edit'));

-- CUSTOMERS
DROP POLICY IF EXISTS "Admin full access customers" ON public.customers;
DROP POLICY IF EXISTS "Public update own customer" ON public.customers;
CREATE POLICY "Admin read customers" ON public.customers FOR SELECT TO authenticated USING (has_admin_permission('orders', 'view'));
CREATE POLICY "Admin update customers" ON public.customers FOR UPDATE TO authenticated USING (has_admin_permission('orders', 'edit')) WITH CHECK (has_admin_permission('orders', 'edit'));
CREATE POLICY "Admin delete customers" ON public.customers FOR DELETE TO authenticated USING (has_admin_permission('orders', 'delete'));

-- COUPONS
DROP POLICY IF EXISTS "Admin full access coupons" ON public.coupons;
CREATE POLICY "Admin read coupons" ON public.coupons FOR SELECT TO authenticated USING (has_admin_permission('products', 'view'));
CREATE POLICY "Admin insert coupons" ON public.coupons FOR INSERT TO authenticated WITH CHECK (has_admin_permission('products', 'create'));
CREATE POLICY "Admin update coupons" ON public.coupons FOR UPDATE TO authenticated USING (has_admin_permission('products', 'edit')) WITH CHECK (has_admin_permission('products', 'edit'));
CREATE POLICY "Admin delete coupons" ON public.coupons FOR DELETE TO authenticated USING (has_admin_permission('products', 'delete'));

-- COUPON_USAGE — admin only, no public insert
DROP POLICY IF EXISTS "Admin full access coupon_usage" ON public.coupon_usage;
CREATE POLICY "Admin read coupon_usage" ON public.coupon_usage FOR SELECT TO authenticated USING (has_admin_permission('orders', 'view'));
CREATE POLICY "Admin insert coupon_usage" ON public.coupon_usage FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admin delete coupon_usage" ON public.coupon_usage FOR DELETE TO authenticated USING (has_admin_permission('orders', 'delete'));

-- REFERRAL_CODES
DROP POLICY IF EXISTS "Admin full access referral_codes" ON public.referral_codes;
CREATE POLICY "Admin read referral_codes" ON public.referral_codes FOR SELECT TO authenticated USING (has_admin_permission('referrals', 'view'));
CREATE POLICY "Admin insert referral_codes" ON public.referral_codes FOR INSERT TO authenticated WITH CHECK (has_admin_permission('referrals', 'edit'));
CREATE POLICY "Admin update referral_codes" ON public.referral_codes FOR UPDATE TO authenticated USING (has_admin_permission('referrals', 'edit'));
CREATE POLICY "Admin delete referral_codes" ON public.referral_codes FOR DELETE TO authenticated USING (has_admin_permission('referrals', 'delete'));

-- REFERRAL_REDEMPTIONS — admin only, no public insert
DROP POLICY IF EXISTS "Admin full access referral_redemptions" ON public.referral_redemptions;
CREATE POLICY "Admin read referral_redemptions" ON public.referral_redemptions FOR SELECT TO authenticated USING (has_admin_permission('referrals', 'view'));
CREATE POLICY "Admin insert referral_redemptions" ON public.referral_redemptions FOR INSERT TO authenticated WITH CHECK (is_admin());

-- BLOG_POSTS
DROP POLICY IF EXISTS "Admin full access blog_posts" ON public.blog_posts;
CREATE POLICY "Admin read blog_posts" ON public.blog_posts FOR SELECT TO authenticated USING (has_admin_permission('blog', 'view'));
CREATE POLICY "Admin insert blog_posts" ON public.blog_posts FOR INSERT TO authenticated WITH CHECK (has_admin_permission('blog', 'create'));
CREATE POLICY "Admin update blog_posts" ON public.blog_posts FOR UPDATE TO authenticated USING (has_admin_permission('blog', 'edit')) WITH CHECK (has_admin_permission('blog', 'edit'));
CREATE POLICY "Admin delete blog_posts" ON public.blog_posts FOR DELETE TO authenticated USING (has_admin_permission('blog', 'delete'));

-- TESTIMONIALS
DROP POLICY IF EXISTS "Admin full access testimonials" ON public.testimonials;
CREATE POLICY "Admin read testimonials" ON public.testimonials FOR SELECT TO authenticated USING (has_admin_permission('content', 'view'));
CREATE POLICY "Admin insert testimonials" ON public.testimonials FOR INSERT TO authenticated WITH CHECK (has_admin_permission('content', 'create'));
CREATE POLICY "Admin update testimonials" ON public.testimonials FOR UPDATE TO authenticated USING (has_admin_permission('content', 'edit'));
CREATE POLICY "Admin delete testimonials" ON public.testimonials FOR DELETE TO authenticated USING (has_admin_permission('content', 'delete'));

-- FAQ_ITEMS
DROP POLICY IF EXISTS "Admin full access faq_items" ON public.faq_items;
CREATE POLICY "Admin read faq_items" ON public.faq_items FOR SELECT TO authenticated USING (has_admin_permission('content', 'view'));
CREATE POLICY "Admin insert faq_items" ON public.faq_items FOR INSERT TO authenticated WITH CHECK (has_admin_permission('content', 'create'));
CREATE POLICY "Admin update faq_items" ON public.faq_items FOR UPDATE TO authenticated USING (has_admin_permission('content', 'edit'));
CREATE POLICY "Admin delete faq_items" ON public.faq_items FOR DELETE TO authenticated USING (has_admin_permission('content', 'delete'));

-- PAGES
DROP POLICY IF EXISTS "Admin full access pages" ON public.pages;
CREATE POLICY "Admin read pages" ON public.pages FOR SELECT TO authenticated USING (has_admin_permission('content', 'view'));
CREATE POLICY "Admin insert pages" ON public.pages FOR INSERT TO authenticated WITH CHECK (has_admin_permission('content', 'create'));
CREATE POLICY "Admin update pages" ON public.pages FOR UPDATE TO authenticated USING (has_admin_permission('content', 'edit'));
CREATE POLICY "Admin delete pages" ON public.pages FOR DELETE TO authenticated USING (has_admin_permission('content', 'delete'));

-- HOMEPAGE_SECTIONS
DROP POLICY IF EXISTS "Admin full access homepage_sections" ON public.homepage_sections;
CREATE POLICY "Admin read homepage_sections" ON public.homepage_sections FOR SELECT TO authenticated USING (has_admin_permission('content', 'view'));
CREATE POLICY "Admin update homepage_sections" ON public.homepage_sections FOR UPDATE TO authenticated USING (has_admin_permission('content', 'edit'));

-- NAVIGATION_LINKS
DROP POLICY IF EXISTS "Admin full access navigation_links" ON public.navigation_links;
CREATE POLICY "Admin read navigation_links" ON public.navigation_links FOR SELECT TO authenticated USING (has_admin_permission('content', 'view'));
CREATE POLICY "Admin insert navigation_links" ON public.navigation_links FOR INSERT TO authenticated WITH CHECK (has_admin_permission('content', 'create'));
CREATE POLICY "Admin update navigation_links" ON public.navigation_links FOR UPDATE TO authenticated USING (has_admin_permission('content', 'edit'));
CREATE POLICY "Admin delete navigation_links" ON public.navigation_links FOR DELETE TO authenticated USING (has_admin_permission('content', 'delete'));

-- SITE_SETTINGS
DROP POLICY IF EXISTS "Admin full access site_settings" ON public.site_settings;
CREATE POLICY "Admin read site_settings" ON public.site_settings FOR SELECT TO authenticated USING (has_admin_permission('settings', 'view'));
CREATE POLICY "Admin update site_settings" ON public.site_settings FOR UPDATE TO authenticated USING (has_admin_permission('settings', 'edit'));
CREATE POLICY "Admin insert site_settings" ON public.site_settings FOR INSERT TO authenticated WITH CHECK (has_admin_permission('settings', 'edit'));

-- DELIVERY_SETTINGS
DROP POLICY IF EXISTS "Admin full access delivery_settings" ON public.delivery_settings;
CREATE POLICY "Admin read delivery_settings" ON public.delivery_settings FOR SELECT TO authenticated USING (has_admin_permission('delivery', 'view'));
CREATE POLICY "Admin insert delivery_settings" ON public.delivery_settings FOR INSERT TO authenticated WITH CHECK (has_admin_permission('delivery', 'edit'));
CREATE POLICY "Admin update delivery_settings" ON public.delivery_settings FOR UPDATE TO authenticated USING (has_admin_permission('delivery', 'edit'));
CREATE POLICY "Admin delete delivery_settings" ON public.delivery_settings FOR DELETE TO authenticated USING (has_admin_permission('delivery', 'delete'));

-- SHIPPING_ZONES
DROP POLICY IF EXISTS "Admin full access shipping_zones" ON public.shipping_zones;
CREATE POLICY "Admin read shipping_zones" ON public.shipping_zones FOR SELECT TO authenticated USING (has_admin_permission('delivery', 'view'));
CREATE POLICY "Admin insert shipping_zones" ON public.shipping_zones FOR INSERT TO authenticated WITH CHECK (has_admin_permission('delivery', 'edit'));
CREATE POLICY "Admin update shipping_zones" ON public.shipping_zones FOR UPDATE TO authenticated USING (has_admin_permission('delivery', 'edit'));
CREATE POLICY "Admin delete shipping_zones" ON public.shipping_zones FOR DELETE TO authenticated USING (has_admin_permission('delivery', 'delete'));

-- TAX_SETTINGS
DROP POLICY IF EXISTS "Admin full access tax_settings" ON public.tax_settings;
CREATE POLICY "Admin read tax_settings" ON public.tax_settings FOR SELECT TO authenticated USING (has_admin_permission('settings', 'view'));
CREATE POLICY "Admin update tax_settings" ON public.tax_settings FOR UPDATE TO authenticated USING (has_admin_permission('settings', 'edit'));

-- SPEND_THRESHOLD_DISCOUNTS
DROP POLICY IF EXISTS "Admin full access spend_threshold_discounts" ON public.spend_threshold_discounts;
CREATE POLICY "Admin read spend_threshold_discounts" ON public.spend_threshold_discounts FOR SELECT TO authenticated USING (has_admin_permission('products', 'view'));
CREATE POLICY "Admin insert spend_threshold_discounts" ON public.spend_threshold_discounts FOR INSERT TO authenticated WITH CHECK (has_admin_permission('products', 'create'));
CREATE POLICY "Admin update spend_threshold_discounts" ON public.spend_threshold_discounts FOR UPDATE TO authenticated USING (has_admin_permission('products', 'edit'));
CREATE POLICY "Admin delete spend_threshold_discounts" ON public.spend_threshold_discounts FOR DELETE TO authenticated USING (has_admin_permission('products', 'delete'));

-- STOCK_NOTIFICATIONS
DROP POLICY IF EXISTS "Admin full access stock_notifications" ON public.stock_notifications;
CREATE POLICY "Admin read stock_notifications" ON public.stock_notifications FOR SELECT TO authenticated USING (has_admin_permission('products', 'view'));
CREATE POLICY "Admin delete stock_notifications" ON public.stock_notifications FOR DELETE TO authenticated USING (has_admin_permission('products', 'delete'));

-- ANALYTICS_EVENTS
DROP POLICY IF EXISTS "Admin full access analytics" ON public.analytics_events;
CREATE POLICY "Admin read analytics" ON public.analytics_events FOR SELECT TO authenticated USING (has_admin_permission('analytics', 'view'));

-- ADMIN_USERS — keep existing fine-grained policies
-- (Read own + super admin manage are already correct)

-- ADMIN_NOTIFICATIONS — keep existing policies (already scoped to own user)

-- ACTIVITY_LOG — keep existing policies (already uses has_admin_permission)

-- REVISIONS
DROP POLICY IF EXISTS "Admin access revisions" ON public.revisions;
CREATE POLICY "Admin read revisions" ON public.revisions FOR SELECT TO authenticated USING (has_admin_permission('activity_log', 'view'));
CREATE POLICY "Admin insert revisions" ON public.revisions FOR INSERT TO authenticated WITH CHECK (is_admin());

-- ============================================================
-- 2. Server-side coupon_usage + referral recording on order insert
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_order_financials()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Record coupon usage
  IF NEW.coupon_id IS NOT NULL AND NEW.discount_amount IS NOT NULL AND NEW.discount_amount > 0 THEN
    INSERT INTO public.coupon_usage (coupon_id, order_id, customer_email, discount_applied)
    VALUES (NEW.coupon_id, NEW.id, NEW.customer_email, NEW.discount_amount);
    
    -- Increment usage_count
    UPDATE public.coupons SET usage_count = COALESCE(usage_count, 0) + 1 WHERE id = NEW.coupon_id;
  END IF;

  -- Record referral redemption
  IF NEW.referral_code_used IS NOT NULL AND NEW.referral_code_used != '' THEN
    DECLARE
      v_ref_id UUID;
    BEGIN
      SELECT id INTO v_ref_id FROM public.referral_codes WHERE code = NEW.referral_code_used AND is_active = true LIMIT 1;
      IF v_ref_id IS NOT NULL THEN
        INSERT INTO public.referral_redemptions (referral_code_id, referred_order_id, discount_amount, referrer_credit)
        VALUES (v_ref_id, NEW.id, 2000, 2000);
        UPDATE public.referral_codes SET times_used = COALESCE(times_used, 0) + 1 WHERE id = v_ref_id;
      END IF;
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS record_order_financials_trigger ON public.orders;
CREATE TRIGGER record_order_financials_trigger
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.record_order_financials();

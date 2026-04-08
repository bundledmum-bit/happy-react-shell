
-- Coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_delivery')),
  discount_value DECIMAL(10,2),
  minimum_order_amount INTEGER,
  maximum_discount_amount INTEGER,
  usage_limit INTEGER,
  usage_limit_per_customer INTEGER DEFAULT 1,
  usage_count INTEGER DEFAULT 0,
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'specific_products', 'specific_categories', 'specific_bundles')),
  applicable_ids UUID[],
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupon usage tracking
CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  customer_email TEXT NOT NULL,
  discount_applied INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  delivery_address TEXT,
  delivery_area TEXT,
  delivery_state TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipping zones
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  areas TEXT[] NOT NULL DEFAULT '{}',
  states TEXT[],
  flat_rate INTEGER NOT NULL,
  free_delivery_threshold INTEGER,
  express_available BOOLEAN DEFAULT FALSE,
  express_rate INTEGER,
  estimated_days_min INTEGER DEFAULT 1,
  estimated_days_max INTEGER DEFAULT 2,
  express_days_min INTEGER DEFAULT 0,
  express_days_max INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax settings
CREATE TABLE IF NOT EXISTS public.tax_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  applies_to TEXT DEFAULT 'all',
  applicable_categories TEXT[],
  is_included_in_price BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order notes
CREATE TABLE IF NOT EXISTS public.order_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  admin_user_id UUID REFERENCES public.admin_users(id),
  note TEXT NOT NULL,
  is_customer_note BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order status history
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.admin_users(id),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock notifications
CREATE TABLE IF NOT EXISTS public.stock_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Navigation links
CREATE TABLE IF NOT EXISTS public.navigation_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL CHECK (location IN ('header', 'footer', 'mobile')),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  parent_id UUID REFERENCES public.navigation_links(id),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  open_in_new_tab BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Homepage sections
CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  section_label TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  custom_data JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pages CMS
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  hero_text TEXT,
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alter orders table for coupon support
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount INTEGER DEFAULT 0;

-- Add file_size, width, height to product_images
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS height INTEGER;

-- RLS: Coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active coupons" ON public.coupons FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admin full access coupons" ON public.coupons FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS: Coupon usage
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert coupon_usage" ON public.coupon_usage FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admin full access coupon_usage" ON public.coupon_usage FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS: Customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access customers" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS: Shipping zones
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read shipping_zones" ON public.shipping_zones FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admin full access shipping_zones" ON public.shipping_zones FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS: Tax settings
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tax_settings" ON public.tax_settings FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admin full access tax_settings" ON public.tax_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS: Order notes
ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access order_notes" ON public.order_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS: Order status history
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access order_status_history" ON public.order_status_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS: Stock notifications
ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert stock_notifications" ON public.stock_notifications FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admin full access stock_notifications" ON public.stock_notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS: Navigation links
ALTER TABLE public.navigation_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read navigation_links" ON public.navigation_links FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admin full access navigation_links" ON public.navigation_links FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS: Homepage sections
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read homepage_sections" ON public.homepage_sections FOR SELECT TO public USING (is_visible = true);
CREATE POLICY "Admin full access homepage_sections" ON public.homepage_sections FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS: Pages
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read pages" ON public.pages FOR SELECT TO public USING (is_published = true);
CREATE POLICY "Admin full access pages" ON public.pages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Enable realtime on new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.coupons;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipping_zones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.navigation_links;
ALTER PUBLICATION supabase_realtime ADD TABLE public.homepage_sections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pages;

-- Seed homepage sections
INSERT INTO public.homepage_sections (section_key, section_label, display_order) VALUES
  ('hero', 'Hero Banner', 0),
  ('trust_bar', 'Trust Statistics Bar', 1),
  ('most_loved', 'Most Loved Items', 2),
  ('bundles_preview', 'Bundle Preview', 3),
  ('why_bundledmum', 'Why BundledMum', 4),
  ('testimonials', 'Testimonials', 5),
  ('final_cta', 'Final Call to Action', 6)
ON CONFLICT (section_key) DO NOTHING;

-- Seed pages
INSERT INTO public.pages (title, slug, content, hero_text) VALUES
  ('Privacy Policy', 'privacy', 'Privacy policy content goes here.', 'Last updated: April 2026'),
  ('Terms & Conditions', 'terms', 'Terms and conditions content goes here.', 'Last updated: April 2026'),
  ('Cookie Policy', 'cookies', 'Cookie policy content goes here.', 'Last updated: April 2026'),
  ('Returns & Exchanges', 'returns', 'Returns policy content goes here.', 'We want you to be completely happy with your order.'),
  ('Our Story', 'about', 'About page content goes here.', 'BundledMum was born from a very real moment of overwhelm.')
ON CONFLICT (slug) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.analytics_events (created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders (created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers (email);

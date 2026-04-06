
-- ========== TABLES ==========

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  emoji TEXT,
  image_url TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('baby', 'mum', 'both')),
  priority TEXT NOT NULL CHECK (priority IN ('essential', 'recommended', 'nice-to-have')),
  pack_count TEXT,
  material TEXT,
  contents TEXT,
  allergen_info TEXT,
  safety_info TEXT,
  rating DECIMAL(2,1) DEFAULT 4.5,
  review_count INTEGER DEFAULT 0,
  gender_relevant BOOLEAN DEFAULT FALSE,
  gender_colors JSONB,
  multiples_bump DECIMAL(2,1) DEFAULT 1.0,
  first_baby BOOLEAN,
  why_included TEXT,
  why_included_variants JSONB,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  badge TEXT CHECK (badge IN ('bestseller', 'essential', 'new', 'popular', 'mum-pick')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.product_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  tag_type TEXT NOT NULL CHECK (tag_type IN ('tier', 'hospital_type', 'delivery_method', 'scope', 'stage')),
  tag_value TEXT NOT NULL,
  UNIQUE(product_id, tag_type, tag_value)
);

CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  brand_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'standard', 'premium')),
  is_default_for_tier BOOLEAN DEFAULT FALSE,
  size_variant TEXT,
  in_stock BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.product_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  size_label TEXT NOT NULL,
  size_code TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  in_stock BOOLEAN DEFAULT TRUE
);

CREATE TABLE public.product_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  color_name TEXT NOT NULL,
  color_hex TEXT,
  gender_match TEXT CHECK (gender_match IN ('boy', 'girl', 'neutral', 'any')),
  display_order INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT TRUE
);

CREATE TABLE public.bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  hospital_type TEXT NOT NULL CHECK (hospital_type IN ('public', 'private', 'gift')),
  delivery_method TEXT CHECK (delivery_method IN ('vaginal', 'csection')),
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'premium')),
  price INTEGER NOT NULL,
  item_count INTEGER NOT NULL,
  description TEXT,
  emoji TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID REFERENCES public.bundles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  brand_id UUID REFERENCES public.brands(id),
  quantity INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  UNIQUE(bundle_id, product_id)
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_city TEXT NOT NULL,
  delivery_state TEXT NOT NULL,
  delivery_notes TEXT,
  subtotal INTEGER NOT NULL,
  delivery_fee INTEGER NOT NULL DEFAULT 0,
  service_fee INTEGER NOT NULL DEFAULT 1500,
  discount INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  payment_reference TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT DEFAULT 'paystack',
  order_status TEXT DEFAULT 'confirmed' CHECK (order_status IN ('confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled')),
  tracking_number TEXT,
  estimated_delivery_start DATE,
  estimated_delivery_end DATE,
  actual_delivery_date DATE,
  quiz_answers JSONB,
  referral_code_used TEXT,
  gift_message TEXT,
  gift_wrapping BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id),
  brand_id UUID REFERENCES public.brands(id),
  product_name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  size TEXT,
  color TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL,
  line_total INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.delivery_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_name TEXT NOT NULL,
  cities TEXT[],
  states TEXT[],
  delivery_fee INTEGER NOT NULL,
  delivery_days_min INTEGER NOT NULL,
  delivery_days_max INTEGER NOT NULL,
  free_delivery_threshold INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_city TEXT NOT NULL,
  customer_initial TEXT,
  quote TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  referrer_name TEXT NOT NULL,
  referrer_email TEXT NOT NULL,
  referrer_order_id UUID REFERENCES public.orders(id),
  times_used INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.referral_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID REFERENCES public.referral_codes(id),
  referred_order_id UUID REFERENCES public.orders(id),
  discount_amount INTEGER NOT NULL DEFAULT 2000,
  referrer_credit INTEGER NOT NULL DEFAULT 2000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL,
  cover_image_url TEXT,
  author TEXT DEFAULT 'BundledMum',
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_data JSONB,
  session_id TEXT,
  referral_source TEXT,
  page_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== FUNCTIONS & TRIGGERS ==========

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.bundles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  today_count INTEGER;
  today_str TEXT;
BEGIN
  today_str := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO today_count FROM public.orders WHERE order_number LIKE 'ORD-' || today_str || '-%';
  NEW.order_number := 'ORD-' || today_str || '-' || LPAD(today_count::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

CREATE OR REPLACE FUNCTION public.get_delivery_fee(p_city TEXT, p_state TEXT, p_subtotal INTEGER)
RETURNS TABLE(fee INTEGER, days_min INTEGER, days_max INTEGER, zone TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN ds.free_delivery_threshold IS NOT NULL AND p_subtotal >= ds.free_delivery_threshold THEN 0
      ELSE ds.delivery_fee
    END,
    ds.delivery_days_min,
    ds.delivery_days_max,
    ds.zone_name
  FROM public.delivery_settings ds
  WHERE ds.is_active = TRUE
    AND (p_city = ANY(ds.cities) OR p_state = ANY(ds.states))
  ORDER BY ds.display_order
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      CASE
        WHEN ds.free_delivery_threshold IS NOT NULL AND p_subtotal >= ds.free_delivery_threshold THEN 0
        ELSE ds.delivery_fee
      END,
      ds.delivery_days_min,
      ds.delivery_days_max,
      ds.zone_name
    FROM public.delivery_settings ds
    WHERE ds.zone_name = 'Others' AND ds.is_active = TRUE
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ========== RLS ==========

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read product_tags" ON public.product_tags FOR SELECT USING (TRUE);
CREATE POLICY "Public read brands" ON public.brands FOR SELECT USING (TRUE);
CREATE POLICY "Public read product_sizes" ON public.product_sizes FOR SELECT USING (TRUE);
CREATE POLICY "Public read product_colors" ON public.product_colors FOR SELECT USING (TRUE);
CREATE POLICY "Public read bundles" ON public.bundles FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read bundle_items" ON public.bundle_items FOR SELECT USING (TRUE);
CREATE POLICY "Public read delivery_settings" ON public.delivery_settings FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (TRUE);
CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read faq_items" ON public.faq_items FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read blog_posts" ON public.blog_posts FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Public read referral_codes" ON public.referral_codes FOR SELECT USING (is_active = TRUE);

-- Public insert policies
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public insert order_items" ON public.order_items FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public insert analytics" ON public.analytics_events FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public insert referral_redemptions" ON public.referral_redemptions FOR INSERT WITH CHECK (TRUE);

-- Admin full access (authenticated = admin)
CREATE POLICY "Admin full access products" ON public.products FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admin full access product_tags" ON public.product_tags FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admin full access brands" ON public.brands FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admin full access product_sizes" ON public.product_sizes FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admin full access product_colors" ON public.product_colors FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admin full access bundles" ON public.bundles FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admin full access bundle_items" ON public.bundle_items FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admin full access orders" ON public.orders FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admin full access order_items" ON public.order_items FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admin full access delivery_settings" ON public.delivery_settings FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admin full access site_settings" ON public.site_settings FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admin full access testimonials" ON public.testimonials FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admin full access referral_codes" ON public.referral_codes FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admin full access referral_redemptions" ON public.referral_redemptions FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admin full access faq_items" ON public.faq_items FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admin full access blog_posts" ON public.blog_posts FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "Admin full access analytics" ON public.analytics_events FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- ========== STORAGE BUCKETS ==========

INSERT INTO storage.buckets (id, name, public) VALUES
  ('product-images', 'product-images', true),
  ('blog-images', 'blog-images', true),
  ('brand-logos', 'brand-logos', true),
  ('sharecards', 'sharecards', true),
  ('order-receipts', 'order-receipts', false);

-- Storage policies for public buckets
CREATE POLICY "Public read product-images" ON storage.objects FOR SELECT USING (bucket_id IN ('product-images', 'blog-images', 'brand-logos', 'sharecards'));
CREATE POLICY "Admin upload product-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('product-images', 'blog-images', 'brand-logos', 'sharecards', 'order-receipts'));
CREATE POLICY "Admin update product-images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('product-images', 'blog-images', 'brand-logos', 'sharecards', 'order-receipts'));
CREATE POLICY "Admin delete product-images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('product-images', 'blog-images', 'brand-logos', 'sharecards', 'order-receipts'));

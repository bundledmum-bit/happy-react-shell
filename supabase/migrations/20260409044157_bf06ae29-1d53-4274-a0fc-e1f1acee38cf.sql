
-- Add bundle pricing mode columns
ALTER TABLE bundles ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) DEFAULT 0;
ALTER TABLE bundles ADD COLUMN IF NOT EXISTS price_mode TEXT DEFAULT 'fixed';

-- Add product subcategory
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- Add spend discount tracking to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS spend_discount_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS spend_discount_percent DECIMAL(5,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS spend_discount_amount INTEGER DEFAULT 0;

-- Create spend_threshold_discounts table
CREATE TABLE IF NOT EXISTS spend_threshold_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  threshold_amount INTEGER NOT NULL,
  discount_percent DECIMAL(5,2) NOT NULL,
  max_discount_amount INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE spend_threshold_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access spend_threshold_discounts" ON spend_threshold_discounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public read active spend_threshold_discounts" ON spend_threshold_discounts FOR SELECT TO public USING (is_active = true);

-- Create product_categories table
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  parent_category TEXT,
  display_order INTEGER DEFAULT 0,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access product_categories" ON product_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public read active product_categories" ON product_categories FOR SELECT TO public USING (is_active = true);

-- Seed product categories
INSERT INTO product_categories (name, slug, parent_category, display_order, icon) VALUES
  ('Nappies & Wipes', 'nappies-wipes', 'baby', 1, '🧷'),
  ('Skincare & Bath', 'skincare-bath', 'baby', 2, '🧴'),
  ('Clothing & Swaddles', 'clothing-swaddles', 'baby', 3, '👶'),
  ('Health & Safety', 'health-safety', 'baby', 4, '🌡️'),
  ('Feeding', 'feeding', 'baby', 5, '🍼'),
  ('Maternity Recovery', 'maternity-recovery', 'mum', 6, '💪'),
  ('Nursing', 'nursing', 'mum', 7, '🤱'),
  ('Hospital Essentials', 'hospital-essentials', 'both', 8, '🏥')
ON CONFLICT (slug) DO NOTHING;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE spend_threshold_discounts;
ALTER PUBLICATION supabase_realtime ADD TABLE product_categories;

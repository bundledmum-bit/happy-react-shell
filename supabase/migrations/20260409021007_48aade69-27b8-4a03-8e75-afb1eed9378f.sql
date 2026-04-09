
-- Add brand image columns
ALTER TABLE brands ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS compare_at_price INTEGER;

-- Add bundle upsell columns
ALTER TABLE bundles ADD COLUMN IF NOT EXISTS upsell_bundle_id UUID REFERENCES bundles(id);
ALTER TABLE bundles ADD COLUMN IF NOT EXISTS upsell_text TEXT;

-- Add brand_id to product_images for brand-specific gallery images
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL;

-- Enable realtime only on tables not yet added
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY['brands','product_images','shipping_zones','products','bundles','bundle_items','delivery_settings','site_settings','orders'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t AND schemaname = 'public'
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;


-- 1. Admin Users
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'viewer',
  custom_permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Activity Log
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES public.admin_users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  entity_name TEXT,
  changes JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Revisions
CREATE TABLE public.revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  revision_number INTEGER NOT NULL,
  data_snapshot JSONB NOT NULL,
  changed_fields TEXT[],
  changed_by UUID REFERENCES public.admin_users(id),
  change_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Admin Notifications
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES public.admin_users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Product Images
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  medium_url TEXT,
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to existing tables
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS og_image_url TEXT;

ALTER TABLE public.bundles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.bundles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.bundles ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE public.bundles ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE public.bundles ADD COLUMN IF NOT EXISTS og_image_url TEXT;

ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS og_image_url TEXT;

ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.faq_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Permission helper function
CREATE OR REPLACE FUNCTION public.has_admin_permission(p_section TEXT, p_action TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_perms JSONB;
BEGIN
  SELECT role, custom_permissions INTO v_role, v_perms
  FROM public.admin_users
  WHERE auth_user_id = auth.uid() AND is_active = TRUE;
  IF v_role IS NULL THEN RETURN FALSE; END IF;
  IF v_role = 'super_admin' THEN RETURN TRUE; END IF;
  IF v_role = 'admin' THEN RETURN p_section != 'users'; END IF;
  IF v_role = 'editor' THEN
    RETURN p_section IN ('products', 'bundles', 'content', 'blog') AND p_action IN ('view', 'create', 'edit');
  END IF;
  IF v_role = 'order_manager' THEN
    IF p_section = 'orders' THEN RETURN TRUE; END IF;
    IF p_section IN ('delivery', 'products') AND p_action = 'view' THEN RETURN TRUE; END IF;
    RETURN FALSE;
  END IF;
  IF v_role = 'viewer' THEN RETURN p_action = 'view'; END IF;
  IF v_role = 'custom' AND v_perms IS NOT NULL THEN
    RETURN COALESCE((v_perms -> p_section ->> p_action)::BOOLEAN, FALSE);
  END IF;
  RETURN FALSE;
END;
$$;

-- RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin manage admin_users" ON public.admin_users FOR ALL TO authenticated
  USING (public.has_admin_permission('users', 'edit')) WITH CHECK (public.has_admin_permission('users', 'edit'));
CREATE POLICY "Read own admin_user" ON public.admin_users FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Insert activity_log" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Read activity_log" ON public.activity_log FOR SELECT TO authenticated
  USING (public.has_admin_permission('activity_log', 'view'));

CREATE POLICY "Admin access revisions" ON public.revisions FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Read own notifications" ON public.admin_notifications FOR SELECT TO authenticated
  USING (admin_user_id IS NULL OR admin_user_id = (SELECT au.id FROM public.admin_users au WHERE au.auth_user_id = auth.uid()));
CREATE POLICY "Update own notifications" ON public.admin_notifications FOR UPDATE TO authenticated
  USING (admin_user_id IS NULL OR admin_user_id = (SELECT au.id FROM public.admin_users au WHERE au.auth_user_id = auth.uid()));
CREATE POLICY "Insert notifications" ON public.admin_notifications FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Public read product_images" ON public.product_images FOR SELECT TO public USING (true);
CREATE POLICY "Admin write product_images" ON public.product_images FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Trigger
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

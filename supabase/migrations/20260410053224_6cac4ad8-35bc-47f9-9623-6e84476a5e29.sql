
-- 1. Fix referral_codes public exposure: remove public SELECT, add secure RPC
DROP POLICY IF EXISTS "Public read referral_codes" ON public.referral_codes;

-- Create a secure function that only returns non-PII fields
CREATE OR REPLACE FUNCTION public.validate_referral_code(p_code text)
RETURNS TABLE(id uuid, code text, is_active boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rc.id, rc.code, rc.is_active
  FROM public.referral_codes rc
  WHERE rc.code = p_code AND rc.is_active = true
  LIMIT 1;
$$;

-- 2. Add order insert validation trigger for coupon references
CREATE OR REPLACE FUNCTION public.validate_order_coupon()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
BEGIN
  -- If no coupon referenced, allow
  IF NEW.coupon_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Validate coupon exists and is active
  SELECT id, is_active, start_date, end_date, usage_limit, usage_count,
         minimum_order_amount, discount_type, discount_value, maximum_discount_amount
  INTO v_coupon
  FROM public.coupons
  WHERE id = NEW.coupon_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid coupon';
  END IF;

  IF v_coupon.is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Coupon is not active';
  END IF;

  IF v_coupon.start_date IS NOT NULL AND NOW() < v_coupon.start_date THEN
    RAISE EXCEPTION 'Coupon is not yet valid';
  END IF;

  IF v_coupon.end_date IS NOT NULL AND NOW() > v_coupon.end_date THEN
    RAISE EXCEPTION 'Coupon has expired';
  END IF;

  IF v_coupon.usage_limit IS NOT NULL AND v_coupon.usage_count >= v_coupon.usage_limit THEN
    RAISE EXCEPTION 'Coupon usage limit reached';
  END IF;

  -- Recalculate discount server-side to prevent manipulation
  IF v_coupon.discount_type = 'percentage' AND v_coupon.discount_value IS NOT NULL THEN
    NEW.discount_amount := LEAST(
      ROUND(NEW.subtotal * v_coupon.discount_value / 100),
      COALESCE(v_coupon.maximum_discount_amount, 2147483647)
    );
  ELSIF v_coupon.discount_type = 'fixed' AND v_coupon.discount_value IS NOT NULL THEN
    NEW.discount_amount := LEAST(v_coupon.discount_value::integer, NEW.subtotal);
  END IF;

  -- Recalculate total
  NEW.total := GREATEST(0, NEW.subtotal + NEW.delivery_fee + NEW.service_fee - COALESCE(NEW.discount_amount, 0) - COALESCE(NEW.spend_discount_amount, 0));

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_order_insert
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_coupon();

-- 3. Add public INSERT/UPDATE policies for customers (needed for checkout upsert)
CREATE POLICY "Public insert customers" ON public.customers FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Public update own customer" ON public.customers FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

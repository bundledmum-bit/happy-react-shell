
-- Fix search_path on generate_order_number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  today_count INTEGER;
  today_str TEXT;
BEGIN
  today_str := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO today_count FROM public.orders WHERE order_number LIKE 'ORD-' || today_str || '-%';
  NEW.order_number := 'ORD-' || today_str || '-' || LPAD(today_count::TEXT, 3, '0');
  RETURN NEW;
END;
$function$;

-- Fix search_path on update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Fix search_path on get_delivery_fee
CREATE OR REPLACE FUNCTION public.get_delivery_fee(p_city text, p_state text, p_subtotal integer)
RETURNS TABLE(fee integer, days_min integer, days_max integer, zone text)
LANGUAGE plpgsql
SET search_path = public
AS $function$
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
$function$;

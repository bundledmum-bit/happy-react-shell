import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ShippingZone {
  id: string;
  name: string;
  areas: string[];
  states: string[] | null;
  flat_rate: number;
  free_delivery_threshold: number | null;
  estimated_days_min: number;
  estimated_days_max: number;
  express_available: boolean;
  express_rate: number | null;
  is_active: boolean;
}

export function useShippingZones() {
  return useQuery({
    queryKey: ["shipping-zones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_zones")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data as ShippingZone[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function calculateDeliveryFee(
  cartTotal: number,
  customerArea: string,
  customerState: string,
  zones: ShippingZone[],
  serviceFee?: number | null,
  defaultFee = 2500,
  defaultThreshold = 30000
) {
  // Match zone: area first, then state, then wildcard
  const zone = zones.find(z =>
    z.areas?.some(a => a.toLowerCase() === customerArea.toLowerCase())
  ) || zones.find(z =>
    z.states?.some(s => s.toLowerCase() === customerState.toLowerCase())
  ) || zones.find(z =>
    z.states?.includes("*")
  );

  if (!zone) {
    const isFree = cartTotal >= defaultThreshold;
    return {
      fee: isFree ? 0 : defaultFee,
      isFree,
      zoneName: "Standard",
      daysMin: 3,
      daysMax: 5,
      freeThreshold: defaultThreshold,
    };
  }

  const isFree = zone.free_delivery_threshold != null && cartTotal >= zone.free_delivery_threshold;
  return {
    fee: isFree ? 0 : zone.flat_rate,
    isFree,
    zoneName: zone.name,
    daysMin: zone.estimated_days_min || 1,
    daysMax: zone.estimated_days_max || 3,
    freeThreshold: zone.free_delivery_threshold,
  };
}

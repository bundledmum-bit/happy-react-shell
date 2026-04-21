import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ShippingZone {
  id: string;
  name: string;
  areas: string[];
  states: string[] | null;
  lgas?: Array<{ lga: string; areas: string[] }>;
  flat_rate: number;
  free_delivery_threshold: number | null;
  estimated_days_min: number;
  estimated_days_max: number;
  express_available: boolean;
  express_rate: number | null;
  is_active: boolean;
  /**
   * JSONB blob on interstate zones:
   *   {
   *     pricing_model: "weight_based_per_10kg",
   *     rates_per_10kg_block: [{ max_kg: number, fee: number }, ...],
   *     bundle_costs?: Record<string, any>
   *   }
   * Null/absent on Lagos zones.
   */
  partner_schedule?: {
    pricing_model?: string;
    rates_per_10kg_block?: Array<{ max_kg: number; fee: number }>;
    [k: string]: any;
  } | null;
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
      return data as unknown as ShippingZone[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Is this zone interstate (i.e. not a Lagos zone)?
 * Lagos zones have "Lagos" in their `states` array; interstate zones
 * are Abuja / Ibadan / Port Harcourt etc.
 */
export function isInterstateZone(zone: ShippingZone): boolean {
  const states = zone.states || [];
  if (states.length === 0) return false;
  return !states.some(s => s.toLowerCase() === "lagos");
}

/**
 * Look up the partner cost for a single eFTD booking of `weightKg` kg
 * from the zone's rates_per_10kg_block bracket table. Returns 0 if the
 * rate table is missing or weight exceeds the highest bracket.
 */
function feeForBookingKg(
  rates: Array<{ max_kg: number; fee: number }>,
  weightKg: number,
): number {
  if (!Array.isArray(rates) || rates.length === 0) return 0;
  const sorted = [...rates].sort((a, b) => a.max_kg - b.max_kg);
  const bracket = sorted.find(r => r.max_kg >= weightKg) || sorted[sorted.length - 1];
  return bracket?.fee || 0;
}

/**
 * Weight-based interstate fee calculation (eFTD, 10 kg per booking,
 * 10 % customer markup). Returns null when the zone can't be priced
 * this way (e.g. missing rate table) so callers can fall back to
 * flat_rate.
 */
export function calculateInterstateFee(zone: ShippingZone, cartWeightKg: number): {
  fee: number;
  weightKg: number;
  roundedKg: number;
  bookingsNeeded: number;
  bookingWeights: number[];
  partnerCost: number;
} | null {
  const rates = zone.partner_schedule?.rates_per_10kg_block;
  if (!Array.isArray(rates) || rates.length === 0) return null;
  if (!isFinite(cartWeightKg) || cartWeightKg <= 0) return null;

  const roundedKg = Math.ceil(cartWeightKg);
  const bookingsNeeded = Math.max(1, Math.ceil(roundedKg / 10));

  // Split into bookings: first (n-1) are 10 kg each, last one gets
  // the remainder (10 if the total is an exact multiple of 10).
  const bookingWeights: number[] = [];
  let remaining = roundedKg;
  for (let i = 0; i < bookingsNeeded; i++) {
    const w = remaining > 10 ? 10 : remaining;
    bookingWeights.push(w);
    remaining -= w;
  }

  const partnerCost = bookingWeights.reduce((s, w) => s + feeForBookingKg(rates, w), 0);
  const fee = Math.round(partnerCost * 1.1); // 10 % customer markup

  return { fee, weightKg: cartWeightKg, roundedKg, bookingsNeeded, bookingWeights, partnerCost };
}

export function calculateDeliveryFee(
  cartTotal: number,
  customerArea: string,
  customerState: string,
  zones: ShippingZone[],
  serviceFee?: number | null,
  defaultFee?: number,
  defaultThreshold?: number,
  /**
   * Optional — total cart weight in kg. When supplied for an interstate
   * zone, we compute the fee from the weight-based rate table instead
   * of the zone's placeholder flat_rate.
   */
  cartWeightKg?: number,
) {
  // Match zone: area first; then state (picking the CHEAPEST matching
  // zone, so a state-only match surfaces the lowest fee rather than an
  // arbitrary first-by-insert-order hit like Ikorodu for Lagos); then
  // wildcard.
  const stateMatches = customerState
    ? (zones || []).filter(z => z.states?.some(s => s.toLowerCase() === customerState.toLowerCase()))
    : [];
  const cheapestForState = stateMatches.length > 0
    ? [...stateMatches].sort((a, b) => (a.flat_rate || 0) - (b.flat_rate || 0))[0]
    : undefined;

  const zone = (customerArea
      ? zones.find(z => z.areas?.some(a => a.toLowerCase() === customerArea.toLowerCase()))
      : undefined)
    || cheapestForState
    || zones.find(z => z.states?.includes("*"));

  if (!zone) {
    const isFree = defaultThreshold != null && defaultThreshold > 0 && cartTotal >= defaultThreshold;
    return {
      fee: isFree ? 0 : (defaultFee || 0),
      isFree,
      zoneName: "Standard",
      daysMin: 3,
      daysMax: 5,
      freeThreshold: defaultThreshold || 0,
      isInterstate: false as const,
    };
  }

  const interstate = isInterstateZone(zone);

  // Interstate zones — weight-based pricing via partner_schedule. No free
  // delivery (the threshold is NULL by design).
  if (interstate) {
    const wb = cartWeightKg && cartWeightKg > 0 ? calculateInterstateFee(zone, cartWeightKg) : null;
    if (wb) {
      return {
        fee: wb.fee,
        isFree: false,
        zoneName: zone.name,
        daysMin: zone.estimated_days_min || 3,
        daysMax: zone.estimated_days_max || 5,
        freeThreshold: zone.free_delivery_threshold,
        isInterstate: true as const,
        weightKg: wb.weightKg,
        roundedKg: wb.roundedKg,
        bookingsNeeded: wb.bookingsNeeded,
        bookingWeights: wb.bookingWeights,
        partnerCost: wb.partnerCost,
      };
    }
    // No weight / no rate table → fall back to flat_rate, still no free delivery.
    return {
      fee: zone.flat_rate,
      isFree: false,
      zoneName: zone.name,
      daysMin: zone.estimated_days_min || 3,
      daysMax: zone.estimated_days_max || 5,
      freeThreshold: zone.free_delivery_threshold,
      isInterstate: true as const,
    };
  }

  // Lagos zones — existing flat_rate + free-delivery-threshold logic.
  const isFree = zone.free_delivery_threshold != null && cartTotal >= zone.free_delivery_threshold;
  return {
    fee: isFree ? 0 : zone.flat_rate,
    isFree,
    zoneName: zone.name,
    daysMin: zone.estimated_days_min || 1,
    daysMax: zone.estimated_days_max || 3,
    freeThreshold: zone.free_delivery_threshold,
    isInterstate: false as const,
  };
}

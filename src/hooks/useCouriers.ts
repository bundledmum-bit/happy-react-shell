import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionPlan {
  plan: string;
  cost: number;
  deliveries: number;
  valid_days: number;
  cost_per_delivery?: number;
}

export interface Courier {
  id: string;
  name: string;
  is_active: boolean;
  coverage: string[] | null;
  address: string | null;
  website: string | null;
  working_hours: string | null;
  working_days: string | null;
  contact_whatsapp: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  pricing_model: "flat_rate" | "weight_based" | "subscription" | string;
  subscription_plans: SubscriptionPlan[] | null;
  weight_limit_kg: number | null;
  weight_rounding: "up" | "down" | null;
  express_available: boolean;
  express_surcharge: number | null;
  excluded_areas: string[] | null;
  special_notes: string | null;
  display_order: number;
}

export interface AdminShippingZone {
  id: string;
  name: string;
  areas: string[] | null;
  states: string[] | null;
  lgas: Array<{ lga: string; areas: string[] }> | null;
  flat_rate: number;
  free_delivery_threshold: number | null;
  express_available: boolean;
  express_rate: number | null;
  estimated_days_min: number;
  estimated_days_max: number;
  express_days_min: number | null;
  express_days_max: number | null;
  display_order: number;
  is_active: boolean;
  primary_partner: string | null;
  secondary_partner: string | null;
  partner_schedule: Record<string, any> | null;
}

export function useCouriers() {
  return useQuery({
    queryKey: ["admin-couriers"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("couriers")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as Courier[];
    },
    staleTime: 60_000,
  });
}

export function useUpdateCourier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (courier: Partial<Courier> & { id: string }) => {
      const { error } = await (supabase as any)
        .from("couriers")
        .update({ ...courier, updated_at: new Date().toISOString() })
        .eq("id", courier.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-couriers"] });
    },
  });
}

export function useCreateCourier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (courier: Partial<Courier>) => {
      const { data, error } = await (supabase as any)
        .from("couriers")
        .insert({ ...courier, updated_at: new Date().toISOString() })
        .select("id")
        .single();
      if (error) throw error;
      return data?.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-couriers"] });
    },
  });
}

export function useDeleteCourier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("couriers")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-couriers"] });
    },
  });
}

export function useReorderCouriers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (idsInOrder: string[]) => {
      await Promise.all(
        idsInOrder.map((id, i) =>
          (supabase as any).from("couriers").update({ display_order: i }).eq("id", id)
        )
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-couriers"] });
    },
  });
}

export function useShippingZonesAdmin() {
  return useQuery({
    queryKey: ["admin-shipping-zones"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("shipping_zones")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as AdminShippingZone[];
    },
    staleTime: 60_000,
  });
}

export function useUpdateShippingZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (zone: Partial<AdminShippingZone> & { id: string }) => {
      const { error } = await (supabase as any)
        .from("shipping_zones")
        .update(zone)
        .eq("id", zone.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shipping-zones"] });
      qc.invalidateQueries({ queryKey: ["shipping-zones"] });
    },
  });
}

// -----------------------------------------------------------------------------
// courier_zone_assignments
// -----------------------------------------------------------------------------
export type ZoneConditionType = "always" | "fallback" | "area_exclusion" | "volume_threshold" | "day_of_week";

export interface CourierZoneAssignment {
  id: string;
  zone_id: string;
  courier_id: string;
  priority: number;
  condition_type: ZoneConditionType | string;
  condition_value: Record<string, any> | null;
  is_active: boolean;
  notes: string | null;
  courier?: { name: string } | null;
  zone?: { name: string } | null;
}

export function useCourierZoneAssignments() {
  return useQuery({
    queryKey: ["admin-courier-zone-assignments"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("courier_zone_assignments")
        .select("*, courier:couriers(name), zone:shipping_zones(name)")
        .order("zone_id")
        .order("priority");
      if (error) throw error;
      return (data || []) as CourierZoneAssignment[];
    },
    staleTime: 30_000,
  });
}

export function useUpsertZoneAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<CourierZoneAssignment>) => {
      // courier / zone are read-only joins and cannot be written back.
      const { courier, zone, ...payload } = row as any;
      if (payload.id) {
        const { error } = await (supabase as any).from("courier_zone_assignments").update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("courier_zone_assignments").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courier-zone-assignments"] }),
  });
}

export function useDeleteZoneAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("courier_zone_assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courier-zone-assignments"] }),
  });
}

// -----------------------------------------------------------------------------
// courier_rate_cards
// -----------------------------------------------------------------------------
export interface CourierRateCard {
  id: string;
  courier_id: string;
  zone_id: string;
  rate_type: string; // e.g. "standard", "bulk"
  partner_cost: number; // kobo
  markup_pct: number;
  customer_rate_override: number | null; // kobo
  bulk_min_orders: number | null;
  weight_limit_kg: number | null;
  weight_rounding: string | null;
  applies_on_days: string[] | null;
  notes: string | null;
  is_active: boolean;
  courier?: { name: string } | null;
  zone?: { name: string } | null;
}

export function useCourierRateCards() {
  return useQuery({
    queryKey: ["admin-courier-rate-cards"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("courier_rate_cards")
        .select("*, courier:couriers(name), zone:shipping_zones(name)")
        .order("zone_id")
        .order("courier_id")
        .order("rate_type");
      if (error) throw error;
      return (data || []) as CourierRateCard[];
    },
    staleTime: 30_000,
  });
}

export function useUpsertRateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<CourierRateCard>) => {
      const { courier, zone, ...payload } = row as any;
      const body = { ...payload, updated_at: new Date().toISOString() };
      if (payload.id) {
        const { error } = await (supabase as any).from("courier_rate_cards").update(body).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("courier_rate_cards").insert(body);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courier-rate-cards"] }),
  });
}

export function useDeleteRateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("courier_rate_cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courier-rate-cards"] }),
  });
}

// -----------------------------------------------------------------------------
// courier_interstate_rates
// -----------------------------------------------------------------------------
export interface CourierInterstateRate {
  id: string;
  courier_id: string;
  zone_id: string;
  weight_kg_max: number;
  partner_cost: number; // kobo
  markup_pct: number;
  weight_rounding: string | null;
  weight_limit_per_booking_kg: number | null;
  is_active: boolean;
  courier?: { name: string } | null;
  zone?: { name: string } | null;
}

export function useCourierInterstateRates() {
  return useQuery({
    queryKey: ["admin-courier-interstate-rates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("courier_interstate_rates")
        .select("*, courier:couriers(name), zone:shipping_zones(name)")
        .order("zone_id")
        .order("weight_kg_max");
      if (error) throw error;
      return (data || []) as CourierInterstateRate[];
    },
    staleTime: 30_000,
  });
}

export function useUpsertInterstateRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<CourierInterstateRate>) => {
      const { courier, zone, ...payload } = row as any;
      const body = { ...payload, updated_at: new Date().toISOString() };
      if (payload.id) {
        const { error } = await (supabase as any).from("courier_interstate_rates").update(body).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("courier_interstate_rates").insert(body);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courier-interstate-rates"] }),
  });
}

export function useDeleteInterstateRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("courier_interstate_rates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courier-interstate-rates"] }),
  });
}

// -----------------------------------------------------------------------------
// courier_routing_rules (single active row)
// -----------------------------------------------------------------------------
export type RoutingStrategy = "cheapest" | "preferred" | "priority";

export interface CourierRoutingRule {
  id: string;
  rule_name: string;
  strategy: RoutingStrategy | string;
  preferred_courier_id: string | null;
  bulk_order_threshold: number | null;
  bulk_window_hours: number | null;
  interstate_courier_id: string | null;
  fallback_courier_id: string | null;
  is_active: boolean;
  notes: string | null;
  preferred_courier?: { name: string } | null;
  interstate_courier?: { name: string } | null;
  fallback_courier?: { name: string } | null;
}

export function useCourierRoutingRules() {
  return useQuery({
    queryKey: ["admin-courier-routing-rules"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("courier_routing_rules")
        .select(
          "*, preferred_courier:couriers!preferred_courier_id(name), interstate_courier:couriers!interstate_courier_id(name), fallback_courier:couriers!fallback_courier_id(name)"
        )
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as CourierRoutingRule | null;
    },
    staleTime: 30_000,
  });
}

export function useUpsertRoutingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<CourierRoutingRule>) => {
      const { preferred_courier, interstate_courier, fallback_courier, ...payload } = row as any;
      const body = { ...payload, updated_at: new Date().toISOString() };
      if (payload.id) {
        const { error } = await (supabase as any).from("courier_routing_rules").update(body).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("courier_routing_rules").insert({ ...body, is_active: true });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-courier-routing-rules"] }),
  });
}

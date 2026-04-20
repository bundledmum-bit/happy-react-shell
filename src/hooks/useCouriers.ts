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

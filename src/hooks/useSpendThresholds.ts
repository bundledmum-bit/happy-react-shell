import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SpendThreshold {
  id: string;
  name: string;
  threshold_amount: number;
  discount_percent: number;
  max_discount_amount: number | null;
  is_active: boolean;
  display_order: number;
}

export function useSpendThresholds() {
  return useQuery({
    queryKey: ["spend-thresholds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spend_threshold_discounts")
        .select("*")
        .eq("is_active", true)
        .order("threshold_amount", { ascending: true });
      if (error) throw error;
      return data as SpendThreshold[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function getSpendPrompt(cartTotal: number, thresholds: SpendThreshold[]) {
  const active = thresholds.filter(t => t.is_active).sort((a, b) => a.threshold_amount - b.threshold_amount);

  // Find highest qualifying threshold
  const qualified = active.filter(t => cartTotal >= t.threshold_amount);
  const currentDiscount = qualified.length > 0 ? qualified[qualified.length - 1] : null;

  // Find next threshold
  const nextThreshold = active.find(t => cartTotal < t.threshold_amount);

  let appliedDiscount = 0;
  if (currentDiscount) {
    const raw = Math.round(cartTotal * (currentDiscount.discount_percent / 100));
    appliedDiscount = currentDiscount.max_discount_amount ? Math.min(raw, currentDiscount.max_discount_amount) : raw;
  }

  if (!nextThreshold && !currentDiscount) return null;

  return {
    currentDiscount,
    appliedDiscount,
    nextThreshold,
    amountNeeded: nextThreshold ? nextThreshold.threshold_amount - cartTotal : 0,
    nextSavings: nextThreshold
      ? Math.round(nextThreshold.threshold_amount * (nextThreshold.discount_percent / 100))
      : 0,
    progress: nextThreshold ? Math.min((cartTotal / nextThreshold.threshold_amount) * 100, 100) : 100,
  };
}

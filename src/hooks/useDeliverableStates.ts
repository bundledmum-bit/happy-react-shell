import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DeliverableState {
  id: string;
  name: string;
  is_active: boolean;
  has_zones: boolean;
  note: string | null;
  display_order: number;
}

export function useDeliverableStates(activeOnly = false) {
  return useQuery({
    queryKey: ["deliverable-states", activeOnly],
    queryFn: async () => {
      let query = (supabase as any)
        .from("deliverable_states")
        .select("*")
        .order("display_order");
      if (activeOnly) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) throw error;
      return data as DeliverableState[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateDeliverableState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (state: Partial<DeliverableState> & { id: string }) => {
      const { error } = await (supabase as any)
        .from("deliverable_states")
        .update({ ...state, updated_at: new Date().toISOString() })
        .eq("id", state.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deliverable-states"] }),
  });
}

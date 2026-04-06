import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminDelivery() {
  const queryClient = useQueryClient();

  const { data: zones, isLoading } = useQuery({
    queryKey: ["admin-delivery"],
    queryFn: async () => {
      const { data, error } = await supabase.from("delivery_settings").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const updateZone = useMutation({
    mutationFn: async (zone: any) => {
      const { error } = await supabase.from("delivery_settings")
        .update({ delivery_fee: zone.delivery_fee, delivery_days_min: zone.delivery_days_min, delivery_days_max: zone.delivery_days_max, free_delivery_threshold: zone.free_delivery_threshold, is_active: zone.is_active })
        .eq("id", zone.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-delivery"] });
      toast.success("Delivery zone updated");
    },
  });

  return (
    <div>
      <h1 className="pf text-2xl font-bold mb-6">Delivery Zones</h1>
      {isLoading ? (
        <div className="text-center py-10 text-text-med">Loading...</div>
      ) : (
        <div className="space-y-4">
          {(zones || []).map((z: any) => (
            <div key={z.id} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">{z.zone_name}</h3>
                <button onClick={() => updateZone.mutate({ ...z, is_active: !z.is_active })}
                  className={`w-10 h-5 rounded-full relative transition-colors ${z.is_active ? "bg-forest" : "bg-border"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-primary-foreground shadow transition-transform ${z.is_active ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-med block mb-1">Fee (₦)</label>
                  <input type="number" defaultValue={z.delivery_fee}
                    onBlur={e => updateZone.mutate({ ...z, delivery_fee: parseInt(e.target.value) })}
                    className="w-full border border-input rounded-lg px-3 py-1.5 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-med block mb-1">Min Days</label>
                  <input type="number" defaultValue={z.delivery_days_min}
                    onBlur={e => updateZone.mutate({ ...z, delivery_days_min: parseInt(e.target.value) })}
                    className="w-full border border-input rounded-lg px-3 py-1.5 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-med block mb-1">Max Days</label>
                  <input type="number" defaultValue={z.delivery_days_max}
                    onBlur={e => updateZone.mutate({ ...z, delivery_days_max: parseInt(e.target.value) })}
                    className="w-full border border-input rounded-lg px-3 py-1.5 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-med block mb-1">Free Over (₦)</label>
                  <input type="number" defaultValue={z.free_delivery_threshold || ""}
                    onBlur={e => updateZone.mutate({ ...z, free_delivery_threshold: parseInt(e.target.value) || null })}
                    className="w-full border border-input rounded-lg px-3 py-1.5 text-sm bg-background" placeholder="None" />
                </div>
              </div>
              <div className="mt-2 text-xs text-text-light">
                States: {(z.states || []).join(", ") || "—"} · Cities: {(z.cities || []).slice(0, 5).join(", ")}{(z.cities || []).length > 5 ? ` +${z.cities.length - 5} more` : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

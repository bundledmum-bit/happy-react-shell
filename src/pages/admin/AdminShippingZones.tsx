import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, X } from "lucide-react";

export default function AdminShippingZones() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);

  const { data: zones, isLoading } = useQuery({
    queryKey: ["admin-shipping-zones"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shipping_zones").select("*").order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const saveZone = useMutation({
    mutationFn: async (zone: any) => {
      const payload = {
        name: zone.name,
        areas: (zone.areas_text || "").split(",").map((a: string) => a.trim()).filter(Boolean),
        states: (zone.states_text || "").split(",").map((a: string) => a.trim()).filter(Boolean),
        flat_rate: parseInt(zone.flat_rate) || 0,
        free_delivery_threshold: parseInt(zone.free_delivery_threshold) || null,
        express_available: zone.express_available || false,
        express_rate: parseInt(zone.express_rate) || null,
        estimated_days_min: parseInt(zone.estimated_days_min) || 1,
        estimated_days_max: parseInt(zone.estimated_days_max) || 2,
        express_days_min: parseInt(zone.express_days_min) || 0,
        express_days_max: parseInt(zone.express_days_max) || 1,
        display_order: parseInt(zone.display_order) || 0,
        is_active: zone.is_active ?? true,
      };
      if (zone.id) {
        const { error } = await supabase.from("shipping_zones").update(payload).eq("id", zone.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("shipping_zones").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-shipping-zones"] }); setEditing(null); toast.success("Zone saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteZone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shipping_zones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-shipping-zones"] }); toast.success("Deleted"); },
  });

  const blankZone = { name: "", areas_text: "", states_text: "", flat_rate: "", free_delivery_threshold: "", express_available: false, express_rate: "", estimated_days_min: "1", estimated_days_max: "2", express_days_min: "0", express_days_max: "1", display_order: "0", is_active: true };

  const zoneToForm = (z: any) => ({ ...z, areas_text: (z.areas || []).join(", "), states_text: (z.states || []).join(", ") });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="pf text-2xl font-bold">Shipping Zones</h1>
        <button onClick={() => setEditing(blankZone)}
          className="flex items-center gap-1.5 bg-forest text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-forest-deep">
          <Plus className="w-4 h-4" /> Add Zone
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-text-med">Loading...</div>
      ) : (
        <div className="space-y-3">
          {(zones || []).map((z: any) => (
            <div key={z.id} className={`bg-card border rounded-xl p-5 ${z.is_active ? "border-border" : "border-border opacity-60"}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">{z.name}</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${z.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {z.is_active ? "Active" : "Inactive"}
                  </span>
                  <button onClick={() => setEditing(zoneToForm(z))} className="p-1.5 hover:bg-muted rounded"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm("Delete?")) deleteZone.mutate(z.id); }} className="p-1.5 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                <div><span className="text-text-light">Flat Rate:</span> <span className="font-semibold">₦{z.flat_rate.toLocaleString()}</span></div>
                <div><span className="text-text-light">Free Over:</span> <span className="font-semibold">{z.free_delivery_threshold ? `₦${z.free_delivery_threshold.toLocaleString()}` : "—"}</span></div>
                <div><span className="text-text-light">Days:</span> <span className="font-semibold">{z.estimated_days_min}–{z.estimated_days_max}</span></div>
                <div><span className="text-text-light">Express:</span> <span className="font-semibold">{z.express_available ? `₦${(z.express_rate || 0).toLocaleString()}` : "No"}</span></div>
                <div><span className="text-text-light">Areas:</span> <span className="font-semibold">{(z.areas || []).length}</span></div>
              </div>
              <div className="mt-2 text-[10px] text-text-light">
                States: {(z.states || []).join(", ") || "—"} · Areas: {(z.areas || []).slice(0, 8).join(", ")}{(z.areas || []).length > 8 ? ` +${z.areas.length - 8} more` : ""}
              </div>
            </div>
          ))}
          {(!zones || zones.length === 0) && <p className="text-center py-10 text-text-med">No shipping zones. Add one to get started.</p>}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-foreground/50 z-[100] flex items-center justify-center" onClick={() => setEditing(null)}>
          <div className="bg-card border border-border rounded-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold">{editing.id ? "Edit Zone" : "Add Zone"}</h3>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-med block mb-1">Zone Name *</label>
                <input value={editing.name} onChange={e => setEditing((p: any) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" placeholder="Lagos Mainland" />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-med block mb-1">Areas (comma-separated)</label>
                <textarea value={editing.areas_text} onChange={e => setEditing((p: any) => ({ ...p, areas_text: e.target.value }))}
                  rows={2} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" placeholder="Yaba, Surulere, Ikeja" />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-med block mb-1">States (comma-separated)</label>
                <input value={editing.states_text} onChange={e => setEditing((p: any) => ({ ...p, states_text: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" placeholder="Lagos" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-med block mb-1">Flat Rate (₦) *</label>
                  <input type="number" value={editing.flat_rate} onChange={e => setEditing((p: any) => ({ ...p, flat_rate: e.target.value }))}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-med block mb-1">Free Over (₦)</label>
                  <input type="number" value={editing.free_delivery_threshold || ""} onChange={e => setEditing((p: any) => ({ ...p, free_delivery_threshold: e.target.value }))}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" placeholder="None" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-med block mb-1">Min Days</label>
                  <input type="number" value={editing.estimated_days_min} onChange={e => setEditing((p: any) => ({ ...p, estimated_days_min: e.target.value }))}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-med block mb-1">Max Days</label>
                  <input type="number" value={editing.estimated_days_max} onChange={e => setEditing((p: any) => ({ ...p, estimated_days_max: e.target.value }))}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.express_available} onChange={e => setEditing((p: any) => ({ ...p, express_available: e.target.checked }))} className="rounded" />
                Express delivery available
              </label>
              {editing.express_available && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-text-med block mb-1">Express Rate</label>
                    <input type="number" value={editing.express_rate || ""} onChange={e => setEditing((p: any) => ({ ...p, express_rate: e.target.value }))}
                      className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-med block mb-1">Exp Min Days</label>
                    <input type="number" value={editing.express_days_min} onChange={e => setEditing((p: any) => ({ ...p, express_days_min: e.target.value }))}
                      className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-med block mb-1">Exp Max Days</label>
                    <input type="number" value={editing.express_days_max} onChange={e => setEditing((p: any) => ({ ...p, express_days_max: e.target.value }))}
                      className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
                  </div>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_active} onChange={e => setEditing((p: any) => ({ ...p, is_active: e.target.checked }))} className="rounded" />
                Active
              </label>
            </div>
            <div className="flex gap-2 p-4 border-t border-border">
              <button onClick={() => setEditing(null)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-muted">Cancel</button>
              <button onClick={() => saveZone.mutate(editing)} disabled={!editing.name}
                className="flex-1 px-4 py-2 bg-forest text-primary-foreground rounded-lg text-sm font-semibold hover:bg-forest-deep disabled:opacity-50">
                Save Zone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

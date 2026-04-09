import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, X, Percent } from "lucide-react";

interface SpendThreshold {
  id: string;
  name: string;
  threshold_amount: number;
  discount_percent: number;
  max_discount_amount: number | null;
  is_active: boolean;
  display_order: number;
}

const fmt = (n: number) => `₦${n.toLocaleString()}`;

export default function AdminPromotions() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<SpendThreshold | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", threshold_amount: "", discount_percent: "", max_discount_amount: "", is_active: true, display_order: "0" });

  const { data: thresholds, isLoading } = useQuery({
    queryKey: ["admin-spend-thresholds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spend_threshold_discounts")
        .select("*")
        .order("threshold_amount", { ascending: true });
      if (error) throw error;
      return data as SpendThreshold[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (payload.id) {
        const { id, ...rest } = payload;
        const { error } = await supabase.from("spend_threshold_discounts").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("spend_threshold_discounts").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-spend-thresholds"] });
      queryClient.invalidateQueries({ queryKey: ["spend-thresholds"] });
      toast.success("Spend threshold saved");
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("spend_threshold_discounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-spend-thresholds"] });
      queryClient.invalidateQueries({ queryKey: ["spend-thresholds"] });
      toast.success("Threshold deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => {
    setEditing(null);
    setCreating(false);
    setForm({ name: "", threshold_amount: "", discount_percent: "", max_discount_amount: "", is_active: true, display_order: "0" });
  };

  const startEdit = (t: SpendThreshold) => {
    setEditing(t);
    setCreating(false);
    setForm({
      name: t.name,
      threshold_amount: String(t.threshold_amount),
      discount_percent: String(t.discount_percent),
      max_discount_amount: t.max_discount_amount != null ? String(t.max_discount_amount) : "",
      is_active: t.is_active,
      display_order: String(t.display_order),
    });
  };

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ name: "", threshold_amount: "", discount_percent: "", max_discount_amount: "", is_active: true, display_order: "0" });
  };

  const handleSave = () => {
    if (!form.name || !form.threshold_amount || !form.discount_percent) {
      toast.error("Name, threshold, and discount % are required");
      return;
    }
    const payload: any = {
      name: form.name,
      threshold_amount: parseInt(form.threshold_amount),
      discount_percent: parseFloat(form.discount_percent),
      max_discount_amount: form.max_discount_amount ? parseInt(form.max_discount_amount) : null,
      is_active: form.is_active,
      display_order: parseInt(form.display_order) || 0,
    };
    if (editing) payload.id = editing.id;
    saveMutation.mutate(payload);
  };

  const previewSavings = form.threshold_amount && form.discount_percent
    ? Math.round(parseInt(form.threshold_amount) * (parseFloat(form.discount_percent) / 100))
    : 0;

  const showForm = creating || editing;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="pf text-2xl font-bold">Spend Threshold Discounts</h1>
          <p className="text-text-med text-sm mt-1">Encourage customers to spend more by offering percentage discounts at spend thresholds.</p>
        </div>
        {!showForm && (
          <button onClick={startCreate} className="flex items-center gap-2 bg-forest text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-forest-deep">
            <Plus className="w-4 h-4" /> Add Threshold
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">{editing ? "Edit Threshold" : "New Threshold"}</h2>
            <button onClick={resetForm} className="text-text-light hover:text-foreground"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-text-med block mb-1">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. 5% off ₦100k+" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-med block mb-1">Spend Threshold (₦)</label>
              <input type="number" value={form.threshold_amount} onChange={e => setForm(f => ({ ...f, threshold_amount: e.target.value }))}
                placeholder="100000" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-med block mb-1">Discount (%)</label>
              <input type="number" step="0.1" value={form.discount_percent} onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value }))}
                placeholder="5" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-med block mb-1">Max Discount Cap (₦) <span className="text-text-light font-normal">optional</span></label>
              <input type="number" value={form.max_discount_amount} onChange={e => setForm(f => ({ ...f, max_discount_amount: e.target.value }))}
                placeholder="Leave empty for no cap" className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-med block mb-1">Display Order</label>
              <input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                <span className="text-sm font-semibold">Active</span>
              </label>
            </div>
          </div>

          {previewSavings > 0 && (
            <div className="mt-4 bg-forest-light border border-forest/20 rounded-lg p-4">
              <p className="text-xs font-semibold text-forest mb-1">💡 Live Preview</p>
              <p className="text-sm text-foreground">
                When a customer spends <strong>{fmt(parseInt(form.threshold_amount))}</strong> or more, they get{" "}
                <strong>{form.discount_percent}% off</strong> — saving up to{" "}
                <strong>{fmt(form.max_discount_amount ? Math.min(previewSavings, parseInt(form.max_discount_amount)) : previewSavings)}</strong>.
              </p>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saveMutation.isPending}
              className="flex items-center gap-2 bg-forest text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-forest-deep disabled:opacity-50">
              <Save className="w-4 h-4" /> {saveMutation.isPending ? "Saving..." : "Save Threshold"}
            </button>
            <button onClick={resetForm} className="px-4 py-2 rounded-lg text-sm font-semibold border border-border text-text-med hover:bg-muted">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-10 text-text-med">Loading...</div>
      ) : !thresholds || thresholds.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Percent className="w-12 h-12 text-text-light mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-1">No spend thresholds yet</h3>
          <p className="text-text-med text-sm mb-4">Create your first spend threshold to encourage larger orders.</p>
          <button onClick={startCreate} className="bg-forest text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-forest-deep">
            <Plus className="w-4 h-4 inline mr-1" /> Create Threshold
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-med">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-med">Threshold</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-med">Discount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-med">Max Cap</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-med">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-med">Actions</th>
              </tr>
            </thead>
            <tbody>
              {thresholds.map(t => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-semibold">{t.name}</td>
                  <td className="px-4 py-3">{fmt(t.threshold_amount)}</td>
                  <td className="px-4 py-3">{t.discount_percent}%</td>
                  <td className="px-4 py-3 text-text-med">{t.max_discount_amount ? fmt(t.max_discount_amount) : "No cap"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-pill text-[11px] font-semibold ${t.is_active ? "bg-forest-light text-forest" : "bg-muted text-text-light"}`}>
                      {t.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => startEdit(t)} className="p-1.5 rounded-lg hover:bg-muted text-text-med hover:text-foreground">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if (confirm("Delete this threshold?")) deleteMutation.mutate(t.id); }}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-text-med hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

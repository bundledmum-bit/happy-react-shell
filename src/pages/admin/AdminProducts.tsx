import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Copy, RotateCcw, Check, X } from "lucide-react";
import AdminProductForm from "./AdminProductForm";
import BulkActionsBar from "@/components/admin/BulkActionsBar";
import TrashTabs from "@/components/admin/TrashTabs";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [trashTab, setTrashTab] = useState<"active" | "trash">("active");
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickEditData, setQuickEditData] = useState<any>({});

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, brands(*), product_sizes(*), product_colors(*), product_tags(*)")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: string }) => {
      if (action === "activate") {
        await supabase.from("products").update({ is_active: true, deleted_at: null }).in("id", ids);
      } else if (action === "deactivate") {
        await supabase.from("products").update({ is_active: false }).in("id", ids);
      } else if (action === "trash") {
        await supabase.from("products").update({ is_active: false, deleted_at: new Date().toISOString() }).in("id", ids);
      } else if (action === "restore") {
        await supabase.from("products").update({ is_active: true, deleted_at: null }).in("id", ids);
      } else if (action === "delete_permanent") {
        await supabase.from("products").delete().in("id", ids);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setSelected(new Set());
      toast.success("Bulk action applied");
    },
  });

  const quickSave = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("products").update(data).eq("id", quickEditId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setQuickEditId(null);
      toast.success("Updated");
    },
  });

  const duplicateProduct = async (p: any) => {
    const { brands, product_sizes, product_colors, product_tags, id, created_at, updated_at, deleted_at, ...rest } = p;
    const { data, error } = await supabase.from("products").insert({ ...rest, name: `${rest.name} (Copy)`, slug: `${rest.slug}-copy-${Date.now()}` }).select("id").single();
    if (error) { toast.error(error.message); return; }
    if (brands?.length) {
      await supabase.from("brands").insert(brands.map((b: any) => ({ product_id: data.id, brand_name: b.brand_name, price: b.price, tier: b.tier, is_default_for_tier: b.is_default_for_tier, display_order: b.display_order })));
    }
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    toast.success("Product duplicated");
  };

  const allProducts = products || [];
  const activeProducts = allProducts.filter((p: any) => !p.deleted_at);
  const trashedProducts = allProducts.filter((p: any) => !!p.deleted_at);
  const displayList = trashTab === "active" ? activeProducts : trashedProducts;

  const filtered = displayList.filter((p: any) => {
    if (catFilter !== "all" && p.category !== catFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const allSelected = filtered.length > 0 && filtered.every((p: any) => selected.has(p.id));

  const handleBulkAction = (action: string) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (action === "delete_permanent" && !confirm("Permanently delete selected products?")) return;
    bulkMutation.mutate({ ids, action });
  };

  const bulkActions = trashTab === "active"
    ? [{ label: "Activate", value: "activate" }, { label: "Deactivate", value: "deactivate" }, { label: "Move to Trash", value: "trash", destructive: true }]
    : [{ label: "Restore", value: "restore" }, { label: "Delete Permanently", value: "delete_permanent", destructive: true }];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="pf text-2xl font-bold">Products ({filtered.length})</h1>
        <button onClick={() => { setEditingProduct(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-forest text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-forest-deep">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <TrashTabs activeTab={trashTab} onTabChange={t => { setTrashTab(t); setSelected(new Set()); }} activeCount={activeProducts.length} trashCount={trashedProducts.length} />

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2 border border-input rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-forest" />
        </div>
        {["all", "baby", "mum"].map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${catFilter === c ? "border-forest bg-forest-light text-forest" : "border-border text-text-med"}`}>
            {c === "all" ? "All" : c === "baby" ? "👶 Baby" : "💛 Mum"}
          </button>
        ))}
      </div>

      <BulkActionsBar selectedCount={selected.size} actions={bulkActions} onApply={handleBulkAction}
        onSelectAll={() => setSelected(new Set(filtered.map((p: any) => p.id)))}
        onDeselectAll={() => setSelected(new Set())} totalCount={filtered.length} allSelected={allSelected} />

      {isLoading ? (
        <div className="text-center py-10 text-text-med">Loading products...</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-3 w-8">
                  <Checkbox checked={allSelected} onCheckedChange={c => c ? setSelected(new Set(filtered.map((p: any) => p.id))) : setSelected(new Set())} />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-text-med">Product</th>
                <th className="px-4 py-3 text-left font-semibold text-text-med">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-text-med">Priority</th>
                <th className="px-4 py-3 text-center font-semibold text-text-med">Brands</th>
                <th className="px-4 py-3 text-center font-semibold text-text-med">Active</th>
                <th className="px-4 py-3 text-right font-semibold text-text-med">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => quickEditId === p.id ? (
                <tr key={p.id} className="border-t border-border bg-forest/5">
                  <td className="px-3 py-2" />
                  <td className="px-4 py-2">
                    <input value={quickEditData.name} onChange={e => setQuickEditData((d: any) => ({ ...d, name: e.target.value }))}
                      className="w-full border border-input rounded px-2 py-1 text-xs bg-background" />
                  </td>
                  <td className="px-4 py-2">
                    <select value={quickEditData.category} onChange={e => setQuickEditData((d: any) => ({ ...d, category: e.target.value }))}
                      className="border border-input rounded px-2 py-1 text-xs bg-background">
                      <option value="baby">baby</option><option value="mum">mum</option><option value="both">both</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <select value={quickEditData.priority} onChange={e => setQuickEditData((d: any) => ({ ...d, priority: e.target.value }))}
                      className="border border-input rounded px-2 py-1 text-xs bg-background">
                      <option value="essential">essential</option><option value="recommended">recommended</option><option value="nice-to-have">nice-to-have</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input type="number" value={quickEditData.display_order} onChange={e => setQuickEditData((d: any) => ({ ...d, display_order: parseInt(e.target.value) || 0 }))}
                      className="w-16 border border-input rounded px-2 py-1 text-xs bg-background text-center" />
                  </td>
                  <td className="px-4 py-2" />
                  <td className="px-4 py-2 text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => quickSave.mutate({ name: quickEditData.name, category: quickEditData.category, priority: quickEditData.priority, display_order: quickEditData.display_order })}
                        className="p-1.5 rounded hover:bg-forest/10 text-forest"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setQuickEditId(null)}
                        className="p-1.5 rounded hover:bg-muted"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-3 py-3">
                    <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.emoji}</span>
                      <div>
                        <div className="font-semibold">{p.name}</div>
                        {p.badge && <span className="text-[10px] px-1.5 py-0.5 bg-coral/10 text-coral rounded font-semibold">{p.badge}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize">{p.category}</td>
                  <td className="px-4 py-3 capitalize">{p.priority}</td>
                  <td className="px-4 py-3 text-center">{p.brands?.length || 0}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${p.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {trashTab === "active" ? (
                        <>
                          <button title="Quick Edit" onClick={() => { setQuickEditId(p.id); setQuickEditData({ name: p.name, category: p.category, priority: p.priority, display_order: p.display_order }); }}
                            className="p-1.5 rounded hover:bg-muted text-text-med text-[10px] font-semibold">QE</button>
                          <button title="Edit" onClick={() => { setEditingProduct(p); setShowForm(true); }}
                            className="p-1.5 rounded hover:bg-muted"><Pencil className="w-3.5 h-3.5" /></button>
                          <button title="Duplicate" onClick={() => duplicateProduct(p)}
                            className="p-1.5 rounded hover:bg-muted"><Copy className="w-3.5 h-3.5" /></button>
                          <button title="Trash" onClick={() => bulkMutation.mutate({ ids: [p.id], action: "trash" })}
                            className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      ) : (
                        <>
                          <button title="Restore" onClick={() => bulkMutation.mutate({ ids: [p.id], action: "restore" })}
                            className="p-1.5 rounded hover:bg-forest/10 text-forest"><RotateCcw className="w-3.5 h-3.5" /></button>
                          <button title="Delete Permanently" onClick={() => { if (confirm("Permanently delete?")) bulkMutation.mutate({ ids: [p.id], action: "delete_permanent" }); }}
                            className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <AdminProductForm product={editingProduct}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
          onSaved={() => { setShowForm(false); setEditingProduct(null); queryClient.invalidateQueries({ queryKey: ["admin-products"] }); }} />
      )}
    </div>
  );
}

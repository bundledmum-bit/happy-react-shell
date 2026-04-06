import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import AdminProductForm from "./AdminProductForm";

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

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

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("products").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product updated");
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deleted");
    },
  });

  const filtered = (products || []).filter((p: any) => {
    if (catFilter !== "all" && p.category !== catFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="pf text-2xl font-bold">Products ({filtered.length})</h1>
        <button onClick={() => { setEditingProduct(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-forest text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-forest-deep">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

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

      {isLoading ? (
        <div className="text-center py-10 text-text-med">Loading products...</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-text-med">Product</th>
                <th className="px-4 py-3 text-left font-semibold text-text-med">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-text-med">Priority</th>
                <th className="px-4 py-3 text-center font-semibold text-text-med">Brands</th>
                <th className="px-4 py-3 text-center font-semibold text-text-med">Rating</th>
                <th className="px-4 py-3 text-center font-semibold text-text-med">Active</th>
                <th className="px-4 py-3 text-right font-semibold text-text-med">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/30">
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
                  <td className="px-4 py-3 text-center">⭐ {p.rating}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive.mutate({ id: p.id, is_active: !p.is_active })}
                      className={`w-10 h-5 rounded-full relative transition-colors ${p.is_active ? "bg-forest" : "bg-border"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-primary-foreground shadow transition-transform ${p.is_active ? "left-5" : "left-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => { setEditingProduct(p); setShowForm(true); }}
                        className="p-1.5 rounded hover:bg-muted"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm("Delete this product?")) deleteProduct.mutate(p.id); }}
                        className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <AdminProductForm
          product={editingProduct}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
          onSaved={() => {
            setShowForm(false);
            setEditingProduct(null);
            queryClient.invalidateQueries({ queryKey: ["admin-products"] });
          }}
        />
      )}
    </div>
  );
}

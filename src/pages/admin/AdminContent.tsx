import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, RotateCcw } from "lucide-react";
import BulkActionsBar from "@/components/admin/BulkActionsBar";
import TrashTabs from "@/components/admin/TrashTabs";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminContent() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "faqs" ? "faqs" : "testimonials";
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [trashTab, setTrashTab] = useState<"active" | "trash">("active");

  const { data: testimonials } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => { const { data, error } = await supabase.from("testimonials").select("*").order("display_order"); if (error) throw error; return data; },
  });

  const { data: faqs } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: async () => { const { data, error } = await supabase.from("faq_items").select("*").order("display_order"); if (error) throw error; return data; },
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ table, ids, action }: { table: string; ids: string[]; action: string }) => {
      const tbl = table as "testimonials" | "faq_items";
      if (action === "activate") await supabase.from(tbl).update({ is_active: true, deleted_at: null }).in("id", ids);
      else if (action === "deactivate") await supabase.from(tbl).update({ is_active: false }).in("id", ids);
      else if (action === "trash") await supabase.from(tbl).update({ is_active: false, deleted_at: new Date().toISOString() }).in("id", ids);
      else if (action === "restore") await supabase.from(tbl).update({ is_active: true, deleted_at: null }).in("id", ids);
      else if (action === "delete_permanent") await supabase.from(tbl).delete().in("id", ids);
      else if (action === "feature") await supabase.from("testimonials").update({ is_featured: true }).in("id", ids);
      else if (action === "unfeature") await supabase.from("testimonials").update({ is_featured: false }).in("id", ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      setSelected(new Set());
      toast.success("Done");
    },
  });

  const currentTable = tab === "testimonials" ? "testimonials" : "faq_items";
  const allItems = (tab === "testimonials" ? testimonials : faqs) || [];
  const activeItems = allItems.filter((i: any) => !i.deleted_at);
  const trashedItems = allItems.filter((i: any) => !!i.deleted_at);
  const displayList = trashTab === "active" ? activeItems : trashedItems;

  const toggleSelect = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };
  const allSelected = displayList.length > 0 && displayList.every((i: any) => selected.has(i.id));

  const bulkActions = trashTab === "active"
    ? [
      { label: "Activate", value: "activate" }, { label: "Deactivate", value: "deactivate" },
      ...(tab === "testimonials" ? [{ label: "Feature", value: "feature" }, { label: "Unfeature", value: "unfeature" }] : []),
      { label: "Move to Trash", value: "trash", destructive: true },
    ]
    : [{ label: "Restore", value: "restore" }, { label: "Delete Permanently", value: "delete_permanent", destructive: true }];

  return (
    <div>
      <h1 className="pf text-2xl font-bold mb-6">Content</h1>
      <div className="flex gap-2 mb-4">
        {(["testimonials", "faqs"] as const).map(t => (
          <button key={t} onClick={() => {
            const sp = new URLSearchParams(searchParams);
            if (t === "testimonials") sp.delete("tab");
            else sp.set("tab", t);
            setSearchParams(sp);
            setSelected(new Set());
            setTrashTab("active");
          }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize ${tab === t ? "bg-forest text-primary-foreground" : "border border-border text-text-med"}`}>
            {t}
          </button>
        ))}
      </div>

      <TrashTabs activeTab={trashTab} onTabChange={t => { setTrashTab(t); setSelected(new Set()); }} activeCount={activeItems.length} trashCount={trashedItems.length} />

      <BulkActionsBar selectedCount={selected.size} actions={bulkActions}
        onApply={a => { const ids = Array.from(selected); if (a === "delete_permanent" && !confirm("Permanently delete?")) return; bulkMutation.mutate({ table: currentTable, ids, action: a }); }}
        onSelectAll={() => setSelected(new Set(displayList.map((i: any) => i.id)))}
        onDeselectAll={() => setSelected(new Set())} totalCount={displayList.length} allSelected={allSelected} />

      {tab === "testimonials" && (
        <div className="space-y-3">
          {displayList.map((t: any) => (
            <div key={t.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Checkbox checked={selected.has(t.id)} onCheckedChange={() => toggleSelect(t.id)} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{t.customer_name}</span>
                    <span className="text-text-light text-xs">— {t.customer_city}</span>
                    <span className="text-xs text-coral">{"⭐".repeat(t.rating)}</span>
                  </div>
                  <p className="text-text-med text-sm italic">"{t.quote}"</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {trashTab === "active" ? (
                    <>
                      <span className={`px-2 py-1 rounded text-[10px] font-semibold ${t.is_featured ? "bg-coral/10 text-coral" : "bg-muted text-text-light"}`}>
                        {t.is_featured ? "Featured" : "Not Featured"}
                      </span>
                      <span className={`px-2 py-1 rounded text-[10px] font-semibold ${t.is_active ? "bg-forest/10 text-forest" : "bg-muted text-text-light"}`}>
                        {t.is_active ? "Active" : "Hidden"}
                      </span>
                      <button onClick={() => bulkMutation.mutate({ table: "testimonials", ids: [t.id], action: "trash" })}
                        className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => bulkMutation.mutate({ table: "testimonials", ids: [t.id], action: "restore" })}
                        className="p-1 rounded hover:bg-forest/10 text-forest"><RotateCcw className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm("Permanently delete?")) bulkMutation.mutate({ table: "testimonials", ids: [t.id], action: "delete_permanent" }); }}
                        className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "faqs" && (
        <div className="space-y-3">
          {displayList.map((f: any) => (
            <div key={f.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Checkbox checked={selected.has(f.id)} onCheckedChange={() => toggleSelect(f.id)} className="mt-1" />
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-1">{f.question}</div>
                  <p className="text-text-med text-xs line-clamp-2">{f.answer}</p>
                  <span className="text-[10px] text-text-light mt-1 inline-block capitalize">{f.category}</span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {trashTab === "active" ? (
                    <>
                      <span className={`px-2 py-1 rounded text-[10px] font-semibold ${f.is_active ? "bg-forest/10 text-forest" : "bg-muted text-text-light"}`}>
                        {f.is_active ? "Active" : "Hidden"}
                      </span>
                      <button onClick={() => bulkMutation.mutate({ table: "faq_items", ids: [f.id], action: "trash" })}
                        className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => bulkMutation.mutate({ table: "faq_items", ids: [f.id], action: "restore" })}
                        className="p-1 rounded hover:bg-forest/10 text-forest"><RotateCcw className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm("Permanently delete?")) bulkMutation.mutate({ table: "faq_items", ids: [f.id], action: "delete_permanent" }); }}
                        className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

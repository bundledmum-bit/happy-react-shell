import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

export default function AdminBundles() {
  const queryClient = useQueryClient();

  const { data: bundles, isLoading } = useQuery({
    queryKey: ["admin-bundles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bundles")
        .select("*, bundle_items(count)")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("bundles").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bundles"] });
      toast.success("Bundle updated");
    },
  });

  return (
    <div>
      <h1 className="pf text-2xl font-bold mb-6">Bundles</h1>
      {isLoading ? (
        <div className="text-center py-10 text-text-med">Loading bundles...</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-text-med">Bundle</th>
                <th className="px-4 py-3 text-left font-semibold text-text-med">Hospital</th>
                <th className="px-4 py-3 text-left font-semibold text-text-med">Delivery</th>
                <th className="px-4 py-3 text-left font-semibold text-text-med">Tier</th>
                <th className="px-4 py-3 text-right font-semibold text-text-med">Price</th>
                <th className="px-4 py-3 text-center font-semibold text-text-med">Items</th>
                <th className="px-4 py-3 text-center font-semibold text-text-med">Active</th>
              </tr>
            </thead>
            <tbody>
              {(bundles || []).map((b: any) => (
                <tr key={b.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{b.emoji}</span>
                      <span className="font-semibold">{b.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize">{b.hospital_type}</td>
                  <td className="px-4 py-3 capitalize">{b.delivery_method || "—"}</td>
                  <td className="px-4 py-3 capitalize">{b.tier}</td>
                  <td className="px-4 py-3 text-right font-semibold">₦{b.price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">{b.item_count}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive.mutate({ id: b.id, is_active: !b.is_active })}
                      className={`w-10 h-5 rounded-full relative transition-colors ${b.is_active ? "bg-forest" : "bg-border"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-primary-foreground shadow transition-transform ${b.is_active ? "left-5" : "left-0.5"}`} />
                    </button>
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

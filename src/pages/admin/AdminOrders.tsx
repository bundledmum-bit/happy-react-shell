import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, ChevronDown, ChevronUp, ExternalLink, Printer, Download } from "lucide-react";
import BulkActionsBar from "@/components/admin/BulkActionsBar";
import PrintInvoice from "@/components/admin/PrintInvoice";
import { Checkbox } from "@/components/ui/checkbox";

const STATUSES = ["confirmed", "processing", "packed", "shipped", "delivered", "cancelled"];
const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700", processing: "bg-yellow-100 text-yellow-700",
  packed: "bg-purple-100 text-purple-700", shipped: "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700",
  pending: "bg-gray-100 text-gray-700", paid: "bg-green-100 text-green-700", failed: "bg-red-100 text-red-700",
};

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [printOrder, setPrintOrder] = useState<any>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase.channel("admin-orders-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, order_status }: { id: string; order_status: string }) => {
      const { error } = await supabase.from("orders").update({ order_status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("Status updated"); },
  });

  const bulkStatusUpdate = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase.from("orders").update({ order_status: status }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); setSelected(new Set()); toast.success("Bulk update done"); },
  });

  const filtered = (orders || []).filter((o: any) => {
    if (statusFilter !== "all" && o.order_status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (o.order_number || "").toLowerCase().includes(s) || (o.customer_name || "").toLowerCase().includes(s) || (o.customer_email || "").toLowerCase().includes(s);
    }
    return true;
  });

  const exportCSV = () => {
    const rows = filtered.map((o: any) => [o.order_number, o.customer_name, o.customer_email, o.customer_phone, o.order_status, o.payment_status, o.total, o.delivery_city, o.delivery_state, o.created_at].join(","));
    const csv = "Order,Name,Email,Phone,Status,Payment,Total,City,State,Date\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "orders-export.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported!");
  };

  const toggleSelect = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };
  const allSelected = filtered.length > 0 && filtered.every((o: any) => selected.has(o.id));

  const handleBulkAction = (action: string) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (STATUSES.includes(action)) bulkStatusUpdate.mutate({ ids, status: action });
    if (action === "export") exportCSV();
  };

  const bulkActions = [...STATUSES.map(s => ({ label: `Set ${s}`, value: s })), { label: "Export CSV", value: "export" }];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="pf text-2xl font-bold">Orders ({filtered.length})</h1>
        <button onClick={exportCSV} className="flex items-center gap-1.5 border border-border px-4 py-2 rounded-lg text-sm font-semibold hover:bg-muted">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..."
            className="w-full pl-9 pr-3 py-2 border border-input rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-forest" />
        </div>
        {["all", ...STATUSES].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize ${statusFilter === s ? "border-forest bg-forest-light text-forest" : "border-border text-text-med"}`}>
            {s}
          </button>
        ))}
      </div>

      <BulkActionsBar selectedCount={selected.size} actions={bulkActions} onApply={handleBulkAction}
        onSelectAll={() => setSelected(new Set(filtered.map((o: any) => o.id)))}
        onDeselectAll={() => setSelected(new Set())} totalCount={filtered.length} allSelected={allSelected} />

      {isLoading ? (
        <div className="text-center py-10 text-text-med">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-text-med">No orders found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o: any) => (
            <div key={o.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30"
                onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}>
                <Checkbox checked={selected.has(o.id)} onCheckedChange={() => toggleSelect(o.id)} onClick={(e: any) => e.stopPropagation()} />
                <div className="flex items-center gap-4 flex-1">
                  <div>
                    <div className="font-semibold text-sm">{o.order_number || "—"}</div>
                    <div className="text-text-light text-xs">{o.customer_name}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[o.order_status] || ""}`}>{o.order_status}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[o.payment_status] || ""}`}>{o.payment_status}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-sm">₦{(o.total || 0).toLocaleString()}</div>
                    <div className="text-text-light text-[10px]">{new Date(o.created_at).toLocaleDateString()}</div>
                  </div>
                  {expandedOrder === o.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
              {expandedOrder === o.id && (
                <div className="border-t border-border p-4 bg-muted/20">
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <h4 className="text-xs font-semibold text-text-med mb-1">Customer</h4>
                      <div className="text-sm">{o.customer_name}</div>
                      <div className="text-xs text-text-light">{o.customer_email}</div>
                      <div className="text-xs text-text-light">{o.customer_phone}</div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-text-med mb-1">Delivery</h4>
                      <div className="text-sm">{o.delivery_address}</div>
                      <div className="text-xs text-text-light">{o.delivery_city}, {o.delivery_state}</div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-text-med mb-1">Financials</h4>
                      <div className="text-xs space-y-0.5">
                        <div>Subtotal: ₦{(o.subtotal || 0).toLocaleString()}</div>
                        <div>Delivery: ₦{(o.delivery_fee || 0).toLocaleString()}</div>
                        <div>Service: ₦{(o.service_fee || 0).toLocaleString()}</div>
                        {o.discount > 0 && <div className="text-green-600">Discount: -₦{o.discount.toLocaleString()}</div>}
                        <div className="font-bold pt-1 border-t border-border">Total: ₦{(o.total || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                  {o.order_items?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-text-med mb-2">Items</h4>
                      <div className="space-y-1">
                        {o.order_items.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-xs bg-card rounded p-2">
                            <span>{item.product_name} ({item.brand_name}){item.size ? ` · ${item.size}` : ""}{item.color ? ` · ${item.color}` : ""}</span>
                            <span className="font-semibold">×{item.quantity} · ₦{(item.line_total || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="text-xs font-semibold text-text-med">Update Status:</label>
                    <select value={o.order_status}
                      onChange={e => updateStatus.mutate({ id: o.id, order_status: e.target.value })}
                      className="border border-input rounded-lg px-3 py-1.5 text-xs bg-background capitalize">
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => setPrintOrder(o)} className="flex items-center gap-1 text-xs font-semibold text-forest hover:underline">
                      <Printer className="w-3 h-3" /> Print Invoice
                    </button>
                    {o.customer_phone && (
                      <a href={`https://wa.me/${o.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${o.customer_name?.split(" ")[0]}! Your BundledMum order ${o.order_number} is now "${o.order_status}".`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-semibold text-[#25D366]">
                        <ExternalLink className="w-3 h-3" /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {printOrder && <PrintInvoice order={printOrder} onClose={() => setPrintOrder(null)} />}
    </div>
  );
}

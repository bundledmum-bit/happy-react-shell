import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, ChevronDown, ChevronUp, ExternalLink, Printer, Download, MessageSquare, Clock, Send } from "lucide-react";
import BulkActionsBar from "@/components/admin/BulkActionsBar";
import PrintInvoice from "@/components/admin/PrintInvoice";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdminUser } from "@/hooks/useAdminPermissions";

const STATUSES = ["confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "refunded"];
const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700", processing: "bg-yellow-100 text-yellow-700",
  packed: "bg-purple-100 text-purple-700", shipped: "bg-cyan-100 text-cyan-700",
  out_for_delivery: "bg-teal-100 text-teal-700",
  delivered: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-200 text-gray-700",
  pending: "bg-gray-100 text-gray-700", paid: "bg-green-100 text-green-700", failed: "bg-red-100 text-red-700",
};

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const { data: adminUser } = useAdminUser();
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

  // Order notes for expanded order
  const { data: orderNotes } = useQuery({
    queryKey: ["admin-order-notes", expandedOrder],
    queryFn: async () => {
      if (!expandedOrder) return [];
      const { data, error } = await supabase.from("order_notes").select("*, admin_users(display_name)").eq("order_id", expandedOrder).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!expandedOrder,
  });

  // Status history for expanded order
  const { data: statusHistory } = useQuery({
    queryKey: ["admin-order-history", expandedOrder],
    queryFn: async () => {
      if (!expandedOrder) return [];
      const { data, error } = await supabase.from("order_status_history").select("*, admin_users(display_name)").eq("order_id", expandedOrder).order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!expandedOrder,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, order_status, old_status }: { id: string; order_status: string; old_status: string }) => {
      const { error } = await supabase.from("orders").update({ order_status }).eq("id", id);
      if (error) throw error;
      // Log status change
      await supabase.from("order_status_history").insert({
        order_id: id,
        old_status,
        new_status: order_status,
        changed_by: adminUser?.id || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-history", expandedOrder] });
      toast.success("Status updated");
    },
  });

  const addNote = useMutation({
    mutationFn: async ({ order_id, note, is_customer_note }: { order_id: string; note: string; is_customer_note: boolean }) => {
      const { error } = await supabase.from("order_notes").insert({
        order_id,
        admin_user_id: adminUser?.id || null,
        note,
        is_customer_note,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-order-notes", expandedOrder] });
      toast.success("Note added");
    },
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
      return (o.order_number || "").toLowerCase().includes(s) || (o.customer_name || "").toLowerCase().includes(s) || (o.customer_email || "").toLowerCase().includes(s) || (o.customer_phone || "").toLowerCase().includes(s);
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
            {s.replace("_", " ")}
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
                  {/* Quick status dropdown */}
                  <select value={o.order_status}
                    onClick={e => e.stopPropagation()}
                    onChange={e => updateStatus.mutate({ id: o.id, order_status: e.target.value, old_status: o.order_status })}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border-0 cursor-pointer capitalize ${STATUS_COLORS[o.order_status] || ""}`}>
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
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
                <OrderDetail order={o} notes={orderNotes || []} history={statusHistory || []} onAddNote={(note, isCustomer) => addNote.mutate({ order_id: o.id, note, is_customer_note: isCustomer })} onPrint={() => setPrintOrder(o)} />
              )}
            </div>
          ))}
        </div>
      )}

      {printOrder && <PrintInvoice order={printOrder} onClose={() => setPrintOrder(null)} />}
    </div>
  );
}

function OrderDetail({ order: o, notes, history, onAddNote, onPrint }: {
  order: any; notes: any[]; history: any[];
  onAddNote: (note: string, isCustomer: boolean) => void;
  onPrint: () => void;
}) {
  const [noteText, setNoteText] = useState("");
  const [isCustomerNote, setIsCustomerNote] = useState(false);

  return (
    <div className="border-t border-border p-4 bg-muted/20 space-y-4">
      {/* Customer / Delivery / Financials */}
      <div className="grid md:grid-cols-3 gap-4">
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
          {o.delivery_notes && <div className="text-xs text-text-light mt-1">Notes: {o.delivery_notes}</div>}
        </div>
        <div>
          <h4 className="text-xs font-semibold text-text-med mb-1">Financials</h4>
          <div className="text-xs space-y-0.5">
            <div>Subtotal: ₦{(o.subtotal || 0).toLocaleString()}</div>
            <div>Delivery: ₦{(o.delivery_fee || 0).toLocaleString()}</div>
            <div>Service: ₦{(o.service_fee || 0).toLocaleString()}</div>
            {(o.discount || 0) > 0 && <div className="text-green-600">Discount: -₦{o.discount.toLocaleString()}</div>}
            <div className="font-bold pt-1 border-t border-border">Total: ₦{(o.total || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Items */}
      {o.order_items?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-text-med mb-2">Items ({o.order_items.length})</h4>
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

      {/* Status Timeline */}
      {history.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-text-med mb-2 flex items-center gap-1"><Clock className="w-3 h-3" /> Status Timeline</h4>
          <div className="relative pl-4 border-l-2 border-border space-y-2">
            {history.map((h: any) => (
              <div key={h.id} className="relative">
                <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-forest border-2 border-card" />
                <div className="text-xs">
                  <span className="capitalize font-semibold">{(h.old_status || "created").replace("_", " ")}</span>
                  <span className="text-text-light"> → </span>
                  <span className="capitalize font-semibold">{h.new_status.replace("_", " ")}</span>
                  <span className="text-text-light ml-2">{new Date(h.created_at).toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  {(h.admin_users as any)?.display_name && <span className="text-text-light ml-1">by {(h.admin_users as any).display_name}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <h4 className="text-xs font-semibold text-text-med mb-2 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Notes</h4>
        <div className="space-y-2 mb-3">
          {notes.map((n: any) => (
            <div key={n.id} className={`text-xs rounded-lg p-2 ${n.is_customer_note ? "bg-blue-50 border border-blue-200" : "bg-muted"}`}>
              <div className="flex justify-between mb-0.5">
                <span className="font-semibold">{(n.admin_users as any)?.display_name || "System"}</span>
                <span className="text-text-light">{new Date(n.created_at).toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div>{n.note}</div>
              {n.is_customer_note && <span className="text-[9px] text-blue-600 font-semibold">Customer-visible</span>}
            </div>
          ))}
          {notes.length === 0 && <p className="text-xs text-text-light">No notes yet</p>}
        </div>
        <div className="flex gap-2">
          <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..."
            className="flex-1 border border-input rounded-lg px-3 py-1.5 text-xs bg-background" />
          <label className="flex items-center gap-1 text-[10px] text-text-light">
            <input type="checkbox" checked={isCustomerNote} onChange={e => setIsCustomerNote(e.target.checked)} className="rounded" />
            Customer
          </label>
          <button onClick={() => { if (noteText.trim()) { onAddNote(noteText, isCustomerNote); setNoteText(""); } }}
            className="px-3 py-1.5 bg-forest text-primary-foreground rounded-lg text-xs font-semibold hover:bg-forest-deep">
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-border">
        <button onClick={onPrint} className="flex items-center gap-1 text-xs font-semibold text-forest hover:underline">
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
  );
}

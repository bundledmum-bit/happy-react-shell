import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Download, ChevronDown, ChevronUp, Printer, MessageSquare, Clock, Send, ExternalLink, ArrowLeft, Truck, CheckCircle2, Package, X as XIcon } from "lucide-react";
import BulkActionsBar from "@/components/admin/BulkActionsBar";
import { openBrandedInvoice } from "@/components/admin/PrintInvoice";
import { Checkbox } from "@/components/ui/checkbox";
import { usePermissions } from "@/hooks/useAdminPermissionsContext";
import { Skeleton } from "@/components/ui/skeleton";
import bmLogoGreen from "@/assets/logos/BM-LOGO-GREEN.svg";

// Couriers that should always appear in the filter even before any
// orders have been assigned to them. Anything else the backend reports
// on existing orders is merged in at render time (see courierOptions
// below).
const DEFAULT_COURIER_PARTNERS = ["Brain Express", "eFTD Africa"];

const ORDER_STATUSES = ["pending", "confirmed", "processing", "packed", "shipped", "delivered", "cancelled", "returned", "refunded", "failed"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];
const PAYMENT_METHODS = ["card", "transfer", "ussd"];
const CANCEL_REASONS = ["customer_request", "out_of_stock", "payment_failed", "fraud_suspected", "other"];
const RETURN_REASONS = ["wrong_item", "damaged", "changed_mind", "not_as_described", "quality_issue", "other"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700", confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-yellow-100 text-yellow-700", packed: "bg-purple-100 text-purple-700",
  shipped: "bg-cyan-100 text-cyan-700", delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700", returned: "bg-orange-100 text-orange-700",
  refunded: "bg-gray-200 text-gray-700", failed: "bg-red-100 text-red-700",
  paid: "bg-green-100 text-green-700",
};

const DATE_PRESETS = [
  { label: "Today", getValue: () => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString(); }},
  { label: "Yesterday", getValue: () => { const d = new Date(); d.setDate(d.getDate()-1); d.setHours(0,0,0,0); return d.toISOString(); }},
  { label: "This Week", getValue: () => { const d = new Date(); d.setDate(d.getDate()-d.getDay()); d.setHours(0,0,0,0); return d.toISOString(); }},
  { label: "This Month", getValue: () => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d.toISOString(); }},
];

const fmt = (n: number) => `₦${n.toLocaleString()}`;

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const { can, adminUser, isSuperAdmin } = usePermissions();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [courierFilter, setCourierFilter] = useState("all");
  const [datePreset, setDatePreset] = useState("This Month");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailOrder, setDetailOrder] = useState<string | null>(null);
  const [bulkRunning, setBulkRunning] = useState<string | null>(null);

  useEffect(() => {
    const channel = supabase.channel("admin-new-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const o = payload.new as any;
        toast.success(`New order received — ${o.order_number || "New Order"}`, { duration: 6000 });
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const dateFrom = useMemo(() => {
    const preset = DATE_PRESETS.find(p => p.label === datePreset);
    return preset ? preset.getValue() : new Date(0).toISOString();
  }, [datePreset]);

  const [currentPage, setCurrentPage] = useState(0);

  const { data: rpcResult, isLoading } = useQuery({
    queryKey: ["admin-orders", currentPage, statusFilter, paymentFilter, search],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_orders", {
        p_limit: 50,
        p_offset: currentPage * 50,
        p_status: statusFilter !== "all" ? statusFilter : null,
        p_payment_status: paymentFilter !== "all" ? paymentFilter : null,
        p_search: search || null,
      });
      if (error) throw error;
      return data as any;
    },
  });

  const orders = rpcResult?.orders || [];
  const totalCount = rpcResult?.total || 0;
  const isPaidOnlyRestricted = rpcResult?.paid_only_restricted || false;

  const filtered = useMemo(() => {
    return (orders || []).filter((o: any) => {
      if (methodFilter !== "all" && o.payment_method !== methodFilter) return false;
      if (o.created_at < dateFrom) return false;
      if (courierFilter !== "all") {
        if (courierFilter === "unassigned") {
          if (o.delivery_partner) return false;
        } else if (o.delivery_partner !== courierFilter) {
          return false;
        }
      }
      return true;
    });
  }, [orders, methodFilter, dateFrom, courierFilter]);

  const stats = useMemo(() => {
    const f = filtered;
    const paid = f.filter((o: any) => o.payment_status === "paid");
    const pending = f.filter((o: any) => o.payment_status === "pending");
    const cancelled = f.filter((o: any) => o.order_status === "cancelled");
    const returned = f.filter((o: any) => o.order_status === "returned");
    const gift = f.filter((o: any) => o.gift_wrapping);
    const gmv = f.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const revenue = paid.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const avg = paid.length > 0 ? Math.round(revenue / paid.length) : 0;
    return { total: f.length, paid: paid.length, pending: pending.length, gmv, revenue, cancelled: cancelled.length, returned: returned.length, avg, gift: gift.length };
  }, [filtered]);

  const toggleSelect = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };
  const allSelected = filtered.length > 0 && filtered.every((o: any) => selected.has(o.id));

  // Courier filter options — always include "All" + "Unassigned", plus
  // the default known partners, plus any other partner actually present
  // in the current orders list (so manually-set values still show up).
  const courierOptions = useMemo(() => {
    const seen = new Set<string>(DEFAULT_COURIER_PARTNERS);
    (orders || []).forEach((o: any) => {
      if (o.delivery_partner) seen.add(String(o.delivery_partner));
    });
    const partners = Array.from(seen).sort();
    return [
      { value: "all", label: "All Couriers" },
      ...partners.map(p => ({ value: p, label: p })),
      { value: "unassigned", label: "Unassigned" },
    ];
  }, [orders]);

  const bulkStatusUpdate = useMutation({
    mutationFn: async ({ ids, status, paymentStatus }: { ids: string[]; status?: string; paymentStatus?: string }) => {
      const update: any = {};
      if (status) update.order_status = status;
      if (paymentStatus) update.payment_status = paymentStatus;
      const { error } = await supabase.from("orders").update(update).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); setSelected(new Set()); toast.success("Bulk update done"); },
  });

  const exportCSV = () => {
    const rows = (selected.size > 0 ? filtered.filter((o: any) => selected.has(o.id)) : filtered).map((o: any) =>
      [o.order_number, o.customer_name, o.customer_phone, o.total, o.payment_status, o.order_status, o.payment_method, o.delivery_partner || "Unassigned", o.created_at].join(",")
    );
    const csv = "Order,Name,Phone,Total,Payment,Status,Method,Courier,Date\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "orders-export.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported!");
  };

  const handleBulkAction = (action: string) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (action === "confirmed") bulkStatusUpdate.mutate({ ids, status: "confirmed" });
    if (action === "mark_paid") bulkStatusUpdate.mutate({ ids, paymentStatus: "paid" });
    if (action === "export") exportCSV();
  };

  // ---- Bulk shipping / delivery / label helpers ----
  const bulkMarkShipped = async () => {
    // Only applies to orders not already shipped or delivered.
    const eligible = filtered.filter((o: any) => selected.has(o.id) && o.order_status !== "shipped" && o.order_status !== "delivered");
    if (eligible.length === 0) { toast.message("No eligible orders (already shipped/delivered)"); return; }
    setBulkRunning(`Marking ${eligible.length} orders as shipped…`);
    const { error } = await supabase
      .from("orders")
      .update({ order_status: "shipped", shipped_at: new Date().toISOString() })
      .in("id", eligible.map((o: any) => o.id));
    setBulkRunning(null);
    if (error) { toast.error(error.message || "Bulk update failed"); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    setSelected(new Set());
    toast.success(`${eligible.length} order${eligible.length === 1 ? "" : "s"} marked as shipped`);
  };

  const bulkMarkDelivered = async () => {
    const eligible = filtered.filter((o: any) => selected.has(o.id) && o.order_status !== "delivered");
    if (eligible.length === 0) { toast.message("No eligible orders (already delivered)"); return; }
    setBulkRunning(`Marking ${eligible.length} orders as delivered…`);
    const { error } = await supabase
      .from("orders")
      .update({ order_status: "delivered", delivered_at: new Date().toISOString() })
      .in("id", eligible.map((o: any) => o.id));
    setBulkRunning(null);
    if (error) { toast.error(error.message || "Bulk update failed"); return; }
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    setSelected(new Set());
    toast.success(`${eligible.length} order${eligible.length === 1 ? "" : "s"} marked as delivered`);
  };

  const bulkPrintLabels = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setBulkRunning(`Fetching ${ids.length} orders…`);
    // Pull full records so we have the delivery fields (address, phone, weight…)
    const { data, error } = await supabase.from("orders").select("*").in("id", ids);
    setBulkRunning(null);
    if (error) { toast.error(error.message || "Failed to fetch orders"); return; }
    const rows = (data || []) as any[];
    if (rows.length === 0) { toast.error("No orders found"); return; }
    try {
      await openDeliveryLabels(rows);
    } catch (e: any) {
      toast.error(e?.message || "Could not open labels window");
    }
  };

  const clearSelection = () => setSelected(new Set());

  const bulkActions = [
    ...(can("orders", "edit_status") ? [{ label: "Mark as confirmed", value: "confirmed" }, { label: "Mark transfers as paid", value: "mark_paid" }] : []),
    ...(can("orders", "export") ? [{ label: "Export selected CSV", value: "export" }] : []),
  ];

  // Fetch full order with items when detail view is open
  const { data: detailOrderData } = useQuery({
    queryKey: ["admin-order-detail", detailOrder],
    queryFn: async () => {
      if (!detailOrder) return null;
      const { data, error } = await supabase.from("orders").select("*, order_items(*)").eq("id", detailOrder).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!detailOrder,
  });

  if (detailOrder) {
    if (!detailOrderData) return <div className="flex justify-center py-20"><Skeleton className="h-8 w-48" /></div>;
    return <OrderDetailPage order={detailOrderData} adminUser={adminUser} can={can} isSuperAdmin={isSuperAdmin} onBack={() => setDetailOrder(null)} onPrint={() => openBrandedInvoice(detailOrderData, adminUser?.id)} />;
  }

  const showFinance = can("finance", "view");

  const statCards = [
    { label: "Total Orders", value: stats.total },
    { label: "Paid Orders", value: stats.paid },
    { label: "Pending Payment", value: stats.pending },
    ...(showFinance ? [
      { label: "GMV", value: fmt(stats.gmv) },
      { label: "Revenue", value: fmt(stats.revenue) },
    ] : []),
    { label: "Cancelled", value: stats.cancelled },
    { label: "Returned", value: stats.returned },
    ...(showFinance ? [{ label: "Avg Order Value", value: fmt(stats.avg) }] : []),
    { label: "Gift Wrapping", value: stats.gift },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="pf text-2xl font-bold">Orders</h1>
        {can("orders", "export") && (
          <button onClick={exportCSV} className="flex items-center gap-1.5 border border-border px-4 py-2 rounded-lg text-sm font-semibold hover:bg-muted">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {DATE_PRESETS.map(p => (
          <button key={p.label} onClick={() => setDatePreset(p.label)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${datePreset === p.label ? "border-forest bg-forest/10 text-forest" : "border-border text-muted-foreground"}`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 md:grid-cols-9 gap-2 mb-4">
        {statCards.map(c => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-3 text-center">
            <div className="text-lg font-bold pf">{c.value}</div>
            <div className="text-muted-foreground text-[9px]">{c.label}</div>
          </div>
        ))}
      </div>

      {isPaidOnlyRestricted && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
          🔒 Showing paid orders only
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order, name, phone..."
            className="w-full pl-9 pr-3 py-2 border border-input rounded-lg text-sm bg-background outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-input rounded-lg px-3 py-2 text-xs bg-background">
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {!isPaidOnlyRestricted && (
          <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="border border-input rounded-lg px-3 py-2 text-xs bg-background">
            <option value="all">All payments</option>
            {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} className="border border-input rounded-lg px-3 py-2 text-xs bg-background">
          <option value="all">All methods</option>
          {PAYMENT_METHODS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="relative inline-flex items-center">
          <Truck className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <select value={courierFilter} onChange={e => setCourierFilter(e.target.value)}
            className="border border-input rounded-lg pl-7 pr-3 py-2 text-xs bg-background">
            {courierOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {courierFilter !== "all" && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-forest/10 text-forest text-[10px] font-semibold">
              {courierOptions.find(o => o.value === courierFilter)?.label} ({filtered.length})
            </span>
          )}
        </div>
      </div>

      {bulkActions.length > 0 && (
        <BulkActionsBar selectedCount={selected.size} actions={bulkActions} onApply={handleBulkAction}
          onSelectAll={() => setSelected(new Set(filtered.map((o: any) => o.id)))}
          onDeselectAll={() => setSelected(new Set())} totalCount={filtered.length} allSelected={allSelected} />
      )}

      {selected.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-card border border-border shadow-2xl rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap max-w-[96vw]">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-forest" />
            <span className="font-semibold">{selected.size} order{selected.size === 1 ? "" : "s"} selected</span>
          </div>
          {bulkRunning && <span className="text-xs text-muted-foreground">{bulkRunning}</span>}
          <div className="flex items-center gap-2 ml-1">
            {can("orders", "edit_status") && (
              <>
                <button onClick={bulkMarkShipped} disabled={!!bulkRunning}
                  className="inline-flex items-center gap-1.5 bg-forest text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-forest-deep disabled:opacity-40">
                  <Truck className="w-3.5 h-3.5" /> Mark Shipped
                </button>
                <button onClick={bulkMarkDelivered} disabled={!!bulkRunning}
                  className="inline-flex items-center gap-1.5 bg-forest text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-forest-deep disabled:opacity-40">
                  <Package className="w-3.5 h-3.5" /> Mark Delivered
                </button>
              </>
            )}
            <button onClick={bulkPrintLabels} disabled={!!bulkRunning}
              className="inline-flex items-center gap-1.5 border border-forest/30 text-forest hover:bg-forest/5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40">
              <Printer className="w-3.5 h-3.5" /> Print Labels
            </button>
            <button onClick={clearSelection}
              className="inline-flex items-center gap-1.5 text-text-med hover:text-foreground text-xs font-semibold px-2 py-1.5">
              <XIcon className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">No data yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b border-border">
                <th className="p-2 text-left w-8"><Checkbox checked={allSelected} onCheckedChange={() => allSelected ? setSelected(new Set()) : setSelected(new Set(filtered.map((o:any)=>o.id)))} /></th>
                <th className="p-2 text-left">Order</th>
                {can("orders", "view_customer") && <th className="p-2 text-left">Customer</th>}
                {can("orders", "view_customer") && <th className="p-2 text-left">Phone</th>}
                {showFinance && <th className="p-2 text-right">Total</th>}
                <th className="p-2 text-center">Payment</th>
                <th className="p-2 text-center">Status</th>
                <th className="p-2 text-center">Courier</th>
                <th className="p-2 text-center">Method</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o: any) => (
                <tr key={o.id}
                  className={`border-b border-border hover:bg-muted/30 cursor-pointer ${selected.has(o.id) ? "bg-emerald-50/60" : ""}`}
                  onClick={() => setDetailOrder(o.id)}>
                  <td className="p-2" onClick={e => e.stopPropagation()}><Checkbox checked={selected.has(o.id)} onCheckedChange={() => toggleSelect(o.id)} /></td>
                  <td className="p-2 font-semibold">{o.order_number || "—"}</td>
                  {can("orders", "view_customer") && <td className="p-2">{o.customer_name}</td>}
                  {can("orders", "view_customer") && <td className="p-2 text-muted-foreground">{o.customer_phone}</td>}
                  {showFinance && <td className="p-2 text-right font-semibold">{fmt(o.total || 0)}</td>}
                  <td className="p-2 text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[o.payment_status] || ""}`}>{o.payment_status}</span></td>
                  <td className="p-2 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${STATUS_COLORS[o.order_status] || ""}`}>{o.order_status}</span>
                    {o.is_quiz_order ? (
                      <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-green-100 text-green-700">Quiz</span>
                    ) : (
                      <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-100 text-gray-500">Direct</span>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    {o.delivery_partner ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-forest/10 text-forest"
                        title={o.courier_note || ""}
                      >
                        <Truck className="w-3 h-3" /> {o.delivery_partner}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">Unassigned</span>
                    )}
                  </td>
                  <td className="p-2 text-center capitalize text-muted-foreground">{o.payment_method}</td>
                  <td className="p-2 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}</td>
                  <td className="p-2 text-center" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setDetailOrder(o.id)} className="text-xs text-forest font-semibold hover:underline">View</button>
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

// ═══════ ORDER DETAIL PAGE ═══════
function OrderDetailPage({ order: o, adminUser, can, isSuperAdmin, onBack, onPrint }: { order: any; adminUser: any; can: (m: string, a: string) => boolean; isSuperAdmin: boolean; onBack: () => void; onPrint: () => void }) {
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState(o.order_status);
  const [statusNote, setStatusNote] = useState("");
  const [noteText, setNoteText] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [issueRefund, setIssueRefund] = useState(false);
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
  const [refundAmount, setRefundAmount] = useState(0);
  const [trackingNumber, setTrackingNumber] = useState(o.tracking_number || "");
  const [actualDelivery, setActualDelivery] = useState(o.actual_delivery_date || "");

  const { data: orderNotes } = useQuery({
    queryKey: ["admin-order-notes", o.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_notes").select("*, admin_users(display_name)").eq("order_id", o.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: statusHistory } = useQuery({
    queryKey: ["admin-order-history", o.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_status_history").select("*, admin_users(display_name)").eq("order_id", o.id).order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = async () => {
    if (newStatus === "cancelled") { setShowCancel(true); return; }
    if (newStatus === "returned") { setShowReturn(true); return; }

    const updates: any = { order_status: newStatus };
    if (newStatus === "packed") updates.packed_at = new Date().toISOString();
    if (newStatus === "shipped") updates.shipped_at = new Date().toISOString();
    if (newStatus === "delivered") updates.delivered_at = new Date().toISOString();

    await supabase.from("orders").update(updates).eq("id", o.id);
    await supabase.from("order_status_history").insert({
      order_id: o.id, old_status: o.order_status, new_status: newStatus,
      changed_by: adminUser?.id || null, note: statusNote || null,
    });
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    queryClient.invalidateQueries({ queryKey: ["admin-order-history", o.id] });
    toast.success(`Status updated to ${newStatus}`);
    setStatusNote("");
  };

  const handleCancel = async () => {
    const updates: any = { order_status: "cancelled", cancellation_reason: cancelReason, cancelled_at: new Date().toISOString(), cancelled_by: adminUser?.id || null };
    if (issueRefund && o.payment_status === "paid") {
      updates.payment_status = "refunded";
      updates.refund_amount = o.total;
      updates.refunded_at = new Date().toISOString();
    }
    await supabase.from("orders").update(updates).eq("id", o.id);
    await supabase.from("order_status_history").insert({
      order_id: o.id, old_status: o.order_status, new_status: "cancelled",
      changed_by: adminUser?.id || null, note: `Reason: ${cancelReason}${issueRefund ? " (refund issued)" : ""}`,
    });
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    queryClient.invalidateQueries({ queryKey: ["admin-order-history", o.id] });
    toast.success("Order cancelled");
    setShowCancel(false);
  };

  const handleReturn = async () => {
    const updates: any = { order_status: "returned", return_reason: returnReason, returned_at: new Date().toISOString() };
    if (refundAmount > 0) {
      updates.payment_status = "refunded";
      updates.refund_amount = refundAmount;
      updates.refunded_at = new Date().toISOString();
    }
    await supabase.from("orders").update(updates).eq("id", o.id);
    await supabase.from("order_returns").insert({
      order_id: o.id, return_reason: returnReason, return_date: returnDate,
      refund_amount: refundAmount || 0, refund_issued: refundAmount > 0,
      refunded_at: refundAmount > 0 ? new Date().toISOString() : null,
      handled_by: adminUser?.id || null,
    });
    await supabase.from("order_status_history").insert({
      order_id: o.id, old_status: o.order_status, new_status: "returned",
      changed_by: adminUser?.id || null, note: `Return reason: ${returnReason}. Refund: ₦${refundAmount.toLocaleString()}`,
    });
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    queryClient.invalidateQueries({ queryKey: ["admin-order-history", o.id] });
    toast.success("Return processed");
    setShowReturn(false);
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    await supabase.from("order_notes").insert({ order_id: o.id, admin_user_id: adminUser?.id || null, note: noteText, is_customer_note: false });
    queryClient.invalidateQueries({ queryKey: ["admin-order-notes", o.id] });
    setNoteText("");
    toast.success("Note added");
  };

  const updatePaymentStatus = async (newPayment: string) => {
    await supabase.from("orders").update({ payment_status: newPayment }).eq("id", o.id);
    await supabase.from("order_status_history").insert({
      order_id: o.id, old_status: o.order_status, new_status: o.order_status,
      changed_by: adminUser?.id || null, note: `Payment status changed to ${newPayment}`,
      is_payment_update: true, old_payment_status: o.payment_status, new_payment_status: newPayment,
    });
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    toast.success("Payment status updated");
  };

  const saveDeliveryInfo = async () => {
    await supabase.from("orders").update({ tracking_number: trackingNumber || null, actual_delivery_date: actualDelivery || null }).eq("id", o.id);
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    toast.success("Delivery info saved");
  };

  const showFinance = can("finance", "view");
  const showCustomer = can("orders", "view_customer");
  const showAddress = showCustomer && can("fulfilment", "view_address");
  const showPayRef = can("orders", "view_payment_ref") || can("finance", "view_paystack");
  const quizAnswers = o.quiz_answers as any;

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-forest font-semibold hover:underline mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </button>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="pf text-2xl font-bold">{o.order_number || "Order"}</h1>
          <p className="text-muted-foreground text-xs">{new Date(o.created_at).toLocaleString()}</p>
          <p className="text-xs mt-0.5">
            Source: {o.is_quiz_order ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-700">Quiz Order</span>
            ) : (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-500">Direct Order</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`px-3 py-1 rounded text-xs font-semibold ${STATUS_COLORS[o.order_status] || ""}`}>{o.order_status}</span>
          <span className={`px-3 py-1 rounded text-xs font-semibold ${STATUS_COLORS[o.payment_status] || ""}`}>{o.payment_status}</span>
        </div>
      </div>

      {/* Courier Assignment — auto-populated when the order is placed */}
      {(o as any).delivery_partner && (
        <div className="rounded-lg border-2 border-forest/30 bg-forest-light p-3 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🚚</span>
            <span className="font-bold text-sm text-forest">
              {(o as any).delivery_partner}
            </span>
          </div>
          {(o as any).courier_note && (
            <p className="text-xs text-text-med leading-relaxed">
              {(o as any).courier_note}
            </p>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Customer Info — gated */}
        {showCustomer && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-bold mb-3">Customer Info</h3>
            <div className="space-y-1 text-sm">
              <div><span className="text-muted-foreground text-xs">Name:</span> {o.customer_name}</div>
              <div><span className="text-muted-foreground text-xs">Phone:</span> {o.customer_phone}</div>
              <div><span className="text-muted-foreground text-xs">Email:</span> {o.customer_email}</div>
              {showAddress && (
                <>
                  <div><span className="text-muted-foreground text-xs">Address:</span> {o.delivery_address}</div>
                  <div><span className="text-muted-foreground text-xs">City/State:</span> {o.delivery_city}, {o.delivery_state}</div>
                  {o.delivery_notes && <div><span className="text-muted-foreground text-xs">Notes:</span> {o.delivery_notes}</div>}
                </>
              )}
              {can("customers", "view") && (
                <a href="/admin/customers" className="text-xs text-forest font-semibold hover:underline mt-1 inline-block">View full profile →</a>
              )}
            </div>
          </div>
        )}

        {/* Payment Info */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold mb-3">Payment Info</h3>
          <div className="space-y-1 text-sm">
            <div><span className="text-muted-foreground text-xs">Method:</span> <span className="capitalize">{o.payment_method}</span></div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">Status:</span>
              {can("orders", "edit_payment") && o.payment_method === "transfer" && o.payment_status === "pending" ? (
                <select value={o.payment_status} onChange={e => updatePaymentStatus(e.target.value)}
                  className="border border-input rounded px-2 py-0.5 text-xs bg-background">
                  <option value="pending">pending</option>
                  <option value="paid">paid</option>
                </select>
              ) : (
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[o.payment_status] || ""}`}>{o.payment_status}</span>
              )}
            </div>
            {showPayRef && o.payment_reference && <div><span className="text-muted-foreground text-xs">Reference:</span> {o.payment_reference}</div>}
            {showPayRef && o.paystack_transaction_id && <div><span className="text-muted-foreground text-xs">Paystack ID:</span> {o.paystack_transaction_id}</div>}
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <h3 className="text-sm font-bold mb-3">Order Summary</h3>
        <div className="space-y-1">
          {(o.order_items || []).map((item: any) => (
            <div key={item.id} className="flex justify-between text-xs bg-muted/30 rounded p-2">
              <div className="min-w-0">
                {item.bundle_name && <div className="text-[10px] font-bold text-coral mb-0.5">📦 {item.bundle_name}</div>}
                <span>{item.product_name} ({item.brand_name}){item.size ? ` · ${item.size}` : ""}{item.color ? ` · ${item.color}` : ""} × {item.quantity}</span>
              </div>
              {showFinance && <span className="font-semibold flex-shrink-0 ml-2">{fmt(item.line_total || 0)}</span>}
            </div>
          ))}
        </div>
        {showFinance && (
          <div className="mt-3 pt-3 border-t border-border space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(o.subtotal || 0)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery Fee</span><span>{fmt(o.delivery_fee || 0)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Service Fee</span><span>{fmt(o.service_fee || 0)}</span></div>
            {(o.discount_amount || 0) > 0 && <div className="flex justify-between text-green-600"><span>Coupon Discount</span><span>-{fmt(o.discount_amount)}</span></div>}
            {(o.spend_discount_amount || 0) > 0 && <div className="flex justify-between text-green-600"><span>Spend Discount ({o.spend_discount_percent}%)</span><span>-{fmt(o.spend_discount_amount)}</span></div>}
            <div className="flex justify-between font-bold text-sm pt-2 border-t border-border"><span>Total</span><span>{fmt(o.total || 0)}</span></div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Delivery Info */}
        {showAddress && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-bold mb-3">Delivery Info</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground text-xs">Est. Delivery:</span> {o.estimated_delivery_start || "—"} to {o.estimated_delivery_end || "—"}</div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">Tracking #:</span>
                <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} className="border border-input rounded px-2 py-1 text-xs bg-background flex-1" placeholder="Enter tracking number" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">Actual Delivery:</span>
                <input type="date" value={actualDelivery} onChange={e => setActualDelivery(e.target.value)} className="border border-input rounded px-2 py-1 text-xs bg-background" />
              </div>
              <button onClick={saveDeliveryInfo} className="px-3 py-1.5 bg-forest text-primary-foreground rounded-lg text-xs font-semibold">Save</button>
            </div>
          </div>
        )}

        {/* Status Management */}
        {can("orders", "edit_status") && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-bold mb-3">Status Management</h3>
            <div className="space-y-2">
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background capitalize">
                {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder={newStatus === "cancelled" || newStatus === "returned" ? "Reason (required)" : "Note (optional)"}
                className="w-full border border-input rounded-lg px-3 py-2 text-xs bg-background" />
              <button onClick={updateStatus} disabled={newStatus === o.order_status}
                className="w-full px-3 py-2 bg-forest text-primary-foreground rounded-lg text-xs font-semibold disabled:opacity-50">
                Update Status
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Flags */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <h3 className="text-sm font-bold mb-3">Order Flags</h3>
        <div className="flex flex-wrap gap-3 text-xs">
          {o.gift_wrapping && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-semibold">🎀 Gift Wrapping</span>}
          {o.gift_message && <span className="bg-muted px-2 py-1 rounded">💌 {o.gift_message}</span>}
          {o.referral_code_used && <span className="bg-muted px-2 py-1 rounded">🔗 Referral: {o.referral_code_used}</span>}
          {quizAnswers && (
            <div className="flex gap-2 flex-wrap">
              {quizAnswers.hospital_type && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">🏥 {quizAnswers.hospital_type}</span>}
              {quizAnswers.delivery_method && <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">🚚 {quizAnswers.delivery_method}</span>}
              {quizAnswers.baby_gender && <span className="bg-pink-50 text-pink-700 px-2 py-1 rounded">👶 {quizAnswers.baby_gender}</span>}
              {quizAnswers.budget_tier && <span className="bg-green-50 text-green-700 px-2 py-1 rounded">💰 {quizAnswers.budget_tier}</span>}
            </div>
          )}
          {!o.gift_wrapping && !quizAnswers && !o.referral_code_used && <span className="text-muted-foreground">No flags</span>}
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-1"><Clock className="w-4 h-4" /> Status Timeline</h3>
        {(statusHistory || []).length === 0 ? <p className="text-xs text-muted-foreground">No data yet</p> : (
          <div className="relative pl-4 border-l-2 border-border space-y-3">
            {(statusHistory || []).map((h: any) => (
              <div key={h.id} className="relative">
                <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-forest border-2 border-card" />
                <div className="text-xs">
                  <span className="capitalize font-semibold">{(h.old_status || "created").replace("_", " ")}</span>
                  <span className="text-muted-foreground"> → </span>
                  <span className="capitalize font-semibold">{h.new_status.replace("_", " ")}</span>
                  {h.note && <span className="text-muted-foreground ml-2">— {h.note}</span>}
                  <div className="text-muted-foreground mt-0.5">
                    {new Date(h.created_at).toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {(h.admin_users as any)?.display_name && <span> by {(h.admin_users as any).display_name}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Notes */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-1"><MessageSquare className="w-4 h-4" /> Admin Notes</h3>
        <div className="space-y-2 mb-3">
          {(orderNotes || []).map((n: any) => (
            <div key={n.id} className="text-xs rounded-lg p-2 bg-muted">
              <div className="flex justify-between mb-0.5">
                <span className="font-semibold">{(n.admin_users as any)?.display_name || "System"}</span>
                <span className="text-muted-foreground">{new Date(n.created_at).toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div>{n.note}</div>
            </div>
          ))}
          {(!orderNotes || orderNotes.length === 0) && <p className="text-xs text-muted-foreground">No notes yet</p>}
        </div>
        {can("orders", "add_note") && (
          <div className="flex gap-2">
            <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..."
              className="flex-1 border border-input rounded-lg px-3 py-1.5 text-xs bg-background" />
            <button onClick={addNote} className="px-3 py-1.5 bg-forest text-primary-foreground rounded-lg text-xs font-semibold">
              <Send className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        {(can("orders", "print_invoice") || can("fulfilment", "print_invoice")) && (
          <button onClick={onPrint} className="flex items-center gap-1 text-xs font-semibold text-forest hover:underline">
            <Printer className="w-3 h-3" /> Print Invoice
          </button>
        )}
        {can("orders", "cancel") && o.order_status !== "cancelled" && (
          <button onClick={() => setShowCancel(true)} className="flex items-center gap-1 text-xs font-semibold text-destructive hover:underline">
            Cancel Order
          </button>
        )}
        {(can("orders", "refund") || can("finance", "process_refunds")) && o.order_status !== "returned" && (
          <button onClick={() => setShowReturn(true)} className="flex items-center gap-1 text-xs font-semibold text-orange-600 hover:underline">
            Process Return
          </button>
        )}
        {isSuperAdmin && (
          <button onClick={async () => { if (!confirm("Permanently delete this order?")) return; await supabase.from("orders").delete().eq("id", o.id); queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); onBack(); toast.success("Order deleted"); }}
            className="flex items-center gap-1 text-xs font-semibold text-destructive hover:underline">
            Delete Order
          </button>
        )}
        {showCustomer && o.customer_phone && (
          <a href={`https://wa.me/${o.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${o.customer_name?.split(" ")[0]}! Your BundledMum order ${o.order_number} is now "${o.order_status}".`)}`}
            target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-semibold text-[#25D366]">
            <ExternalLink className="w-3 h-3" /> WhatsApp
          </a>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancel && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center" onClick={() => setShowCancel(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-sm mb-4">Cancel Order</h3>
            <label className="text-xs font-semibold text-muted-foreground">Reason</label>
            <select value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background mb-3 capitalize">
              {CANCEL_REASONS.map(r => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
            </select>
            {o.payment_status === "paid" && (
              <label className="flex items-center gap-2 text-xs mb-4">
                <input type="checkbox" checked={issueRefund} onChange={e => setIssueRefund(e.target.checked)} />
                Issue refund ({fmt(o.total)})
              </label>
            )}
            <div className="flex gap-2">
              <button onClick={() => setShowCancel(false)} className="flex-1 px-3 py-2 border border-border rounded-lg text-xs font-semibold">Cancel</button>
              <button onClick={handleCancel} className="flex-1 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg text-xs font-semibold">Confirm Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturn && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center" onClick={() => setShowReturn(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-sm mb-4">Process Return</h3>
            <label className="text-xs font-semibold text-muted-foreground">Reason</label>
            <select value={returnReason} onChange={e => setReturnReason(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background mb-3 capitalize">
              {RETURN_REASONS.map(r => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
            </select>
            <label className="text-xs font-semibold text-muted-foreground">Return Date</label>
            <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background mb-3" />
            <label className="text-xs font-semibold text-muted-foreground">Refund Amount (optional)</label>
            <input type="number" value={refundAmount} onChange={e => setRefundAmount(Number(e.target.value))} className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background mb-3" />
            <div className="flex gap-2">
              <button onClick={() => setShowReturn(false)} className="flex-1 px-3 py-2 border border-border rounded-lg text-xs font-semibold">Cancel</button>
              <button onClick={handleReturn} className="flex-1 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg text-xs font-semibold">Process Return</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Delivery labels (print) ----------

let _labelLogoDataUrl: string | null = null;
async function getLabelLogo(): Promise<string> {
  if (_labelLogoDataUrl) return _labelLogoDataUrl;
  try {
    const res = await fetch(bmLogoGreen);
    const blob = await res.blob();
    const url = await new Promise<string>(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    _labelLogoDataUrl = url;
    return url;
  } catch {
    return "";
  }
}

function escapeHtml(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

/** Open a new window with one A6 delivery label per order, 2 per A4 page. */
async function openDeliveryLabels(orders: any[]): Promise<void> {
  const logo = await getLabelLogo();
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const title = `DeliveryLabels_${dateStr}_${orders.length}orders`;
  const brand = "#2D6A4F";

  const labels = orders.map(o => {
    const cityLine = [o.delivery_city, o.delivery_state].filter(Boolean).join(", ");
    const weightStr = o.estimated_weight_kg != null ? `${Number(o.estimated_weight_kg).toFixed(1)}kg` : "—";
    return `
      <div class="label">
        <div class="brand">
          ${logo ? `<img src="${logo}" alt="BundledMum">` : `<span class="wordmark">BundledMum</span>`}
          <div class="url">bundledmum.com</div>
        </div>
        <div class="section">
          <div class="section-label">TO</div>
          <div class="to-name">${escapeHtml(o.customer_name)}</div>
          ${o.delivery_address ? `<div class="to-line">${escapeHtml(o.delivery_address)}</div>` : ""}
          ${cityLine ? `<div class="to-line">${escapeHtml(cityLine)}</div>` : ""}
          ${o.customer_phone ? `<div class="to-phone">${escapeHtml(o.customer_phone)}</div>` : ""}
        </div>
        <div class="meta">
          <div class="row"><span class="k">ORDER</span><span class="v">${escapeHtml(o.order_number || "—")}</span></div>
          <div class="row"><span class="k">COURIER</span><span class="v">${escapeHtml(o.delivery_partner || "Unassigned")}</span></div>
          <div class="row"><span class="k">WEIGHT</span><span class="v">${escapeHtml(weightStr)}</span></div>
        </div>
        ${o.delivery_notes ? `<div class="notes">${escapeHtml(o.delivery_notes)}</div>` : ""}
      </div>`;
  }).join("");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #f5f5f5; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #1a1a1a; }
  .sheet { display: flex; flex-direction: column; align-items: center; padding: 10mm 0; gap: 4mm; }
  .label {
    width: 105mm; height: 148mm;
    background: #fff; border: 1px solid #ccc;
    padding: 10mm; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    display: flex; flex-direction: column;
    page-break-inside: avoid;
  }
  .brand { display: flex; justify-content: space-between; align-items: center; padding-bottom: 6mm; border-bottom: 2px solid ${brand}; }
  .brand img { max-height: 10mm; display: block; }
  .brand .wordmark { font-weight: 700; color: ${brand}; font-size: 14px; letter-spacing: 1px; }
  .brand .url { font-size: 9px; color: #666; letter-spacing: 0.5px; }
  .section { margin-top: 5mm; padding-bottom: 4mm; border-bottom: 1px solid #e5e5e5; flex: 1; }
  .section-label { font-size: 9px; letter-spacing: 2px; color: #999; font-weight: 600; margin-bottom: 2mm; }
  .to-name { font-size: 14px; font-weight: 700; margin-bottom: 1mm; }
  .to-line { font-size: 11px; color: #333; margin-bottom: 0.5mm; }
  .to-phone { font-size: 11px; color: #333; margin-top: 1.5mm; font-weight: 600; }
  .meta { margin-top: 4mm; border-bottom: 1px solid #e5e5e5; padding-bottom: 4mm; }
  .meta .row { display: flex; justify-content: space-between; font-size: 10px; padding: 1.2mm 0; }
  .meta .k { color: #999; font-weight: 600; letter-spacing: 1px; }
  .meta .v { font-weight: 600; color: #222; font-family: ui-monospace, Menlo, monospace; }
  .notes { margin-top: 3mm; font-size: 9.5px; color: #555; font-style: italic; line-height: 1.4; }
  @page { size: A4 portrait; margin: 0; }
  @media print {
    body { background: #fff; }
    .sheet { padding: 0; gap: 0; }
    .label { border: none; box-shadow: none; margin: 0 auto; }
  }
</style>
</head>
<body>
  <div class="sheet">
    ${labels}
  </div>
  <script>
    window.addEventListener("load", function () {
      setTimeout(function () { window.focus(); window.print(); }, 150);
    });
  </script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=1100");
  if (!win) { throw new Error("Popup blocked — please allow popups to print labels"); }
  win.document.open();
  win.document.write(html);
  win.document.close();
  try { win.document.title = title; } catch { /* cross-origin noop */ }
}

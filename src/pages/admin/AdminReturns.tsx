import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RotateCcw, X, CheckCircle2, ClipboardCheck, PackageCheck, Wallet, Ban } from "lucide-react";
import { usePermissions } from "@/hooks/useAdminPermissionsContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReturnRow {
  return_id: string;
  order_id: string;
  order_number: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  order_total: number | null;
  payment_method: string | null;
  return_status: string;
  return_type: string | null;
  return_reason: string | null;
  return_reason_notes: string | null;
  refund_amount: number | null;
  refund_issued: boolean | null;
  stock_restored: boolean | null;
  items_returned: any[] | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  return_date: string | null;
  approved_at: string | null;
  refunded_at: string | null;
  completed_at: string | null;
  created_at: string;
}

const fmt = (n: number | null | undefined) => `₦${Math.round(Number(n) || 0).toLocaleString()}`;

const STATUS_META: Record<string, { label: string; cls: string }> = {
  requested:      { label: "Pending",        cls: "bg-yellow-100 text-yellow-800" },
  approved:       { label: "Approved",       cls: "bg-blue-100 text-blue-700" },
  stock_restored: { label: "Stock Restored", cls: "bg-purple-100 text-purple-700" },
  refund_issued:  { label: "Refunded",       cls: "bg-emerald-100 text-emerald-700" },
  completed:      { label: "Completed",      cls: "bg-emerald-100 text-emerald-700" },
  rejected:       { label: "Rejected",       cls: "bg-red-100 text-red-700" },
};

const TYPE_LABEL: Record<string, string> = {
  return_refund: "Return + Refund",
  exchange:      "Exchange",
  store_credit:  "Store Credit",
  return_only:   "Return Only",
};

const FILTERS: Array<{ key: string; label: string }> = [
  { key: "all",            label: "All" },
  { key: "requested",      label: "Requested" },
  { key: "approved",       label: "Approved" },
  { key: "refund_issued",  label: "Refund Issued" },
  { key: "completed",      label: "Completed" },
  { key: "rejected",       label: "Rejected" },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminReturns() {
  const qc = useQueryClient();
  const { adminUser } = usePermissions();
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin_returns_view"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("admin_returns_view")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ReturnRow[];
    },
  });

  const filtered = useMemo(() => {
    if (filter === "all") return rows || [];
    return (rows || []).filter(r => r.return_status === filter);
  }, [rows, filter]);

  // Stats (this month)
  const stats = useMemo(() => {
    const startOfMonth = (() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; })();
    const thisMonth = (rows || []).filter(r => new Date(r.created_at) >= startOfMonth);
    const pending = (rows || []).filter(r => r.return_status === "requested").length;
    const refundedThisMonth = thisMonth.filter(r => r.return_status === "refund_issued" || r.return_status === "completed");
    const refundsAmount = refundedThisMonth.reduce((s, r) => s + (Number(r.refund_amount) || 0), 0);
    const stockRestored = thisMonth.filter(r => r.stock_restored === true).length;
    return {
      total: thisMonth.length,
      pending,
      refundsAmount,
      stockRestored,
    };
  }, [rows]);

  // Mutation — generic status update.
  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; patch: Record<string, any> }) => {
      const { error } = await (supabase as any)
        .from("order_returns")
        .update({ ...payload.patch, updated_at: new Date().toISOString() })
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_returns_view"] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e: any) => toast.error(e?.message || "Update failed"),
  });

  const selected = (rows || []).find(r => r.return_id === selectedId) || null;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-forest flex items-center gap-2">
          <RotateCcw className="w-6 h-6" /> Returns & Refunds
        </h1>
        <p className="text-xs text-text-light mt-1">Approve, restore stock, and issue refunds for customer returns.</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<ClipboardCheck className="w-4 h-4" />} label="Total this month" value={String(stats.total)} />
        <StatCard icon={<RotateCcw className="w-4 h-4" />}      label="Pending approval" value={String(stats.pending)} highlight={stats.pending > 0} />
        <StatCard icon={<Wallet className="w-4 h-4" />}         label="Refunds this month" value={fmt(stats.refundsAmount)} />
        <StatCard icon={<PackageCheck className="w-4 h-4" />}   label="Stock restored" value={String(stats.stockRestored)} />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors ${filter === f.key ? "border-forest text-forest" : "border-transparent text-text-med hover:text-forest"}`}
          >
            {f.label}
            {f.key !== "all" && (
              <span className="ml-1 text-[10px] text-text-light">({(rows || []).filter(r => r.return_status === f.key).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-3 py-2">Order #</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2 text-right">Refund</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-text-light">Loading returns…</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-text-light">No returns match this filter.</td></tr>
              )}
              {filtered.map(r => {
                const meta = STATUS_META[r.return_status] || { label: r.return_status, cls: "bg-muted text-text-med" };
                const itemCount = Array.isArray(r.items_returned) ? r.items_returned.length : 0;
                return (
                  <tr key={r.return_id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-3 py-2 font-semibold">{r.order_number || "—"}</td>
                    <td className="px-3 py-2">{r.customer_name || "—"}</td>
                    <td className="px-3 py-2 text-text-light">{new Date(r.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}</td>
                    <td className="px-3 py-2">{itemCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(r.refund_amount)}</td>
                    <td className="px-3 py-2 text-[10px] text-text-med">{TYPE_LABEL[r.return_type || ""] || r.return_type || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-semibold ${meta.cls}`}>{meta.label}</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => setSelectedId(r.return_id)} className="text-xs text-forest font-semibold hover:underline">View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <ReturnDetailSheet
          row={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={(patch) => updateMutation.mutateAsync({ id: selected.return_id, patch })}
          adminUserId={adminUser?.id || null}
          busy={updateMutation.isPending}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`bg-card border rounded-xl p-3 ${highlight ? "border-coral/50 bg-coral/5" : "border-border"}`}>
      <div className="flex items-center gap-1.5 text-text-light text-[10px] uppercase tracking-widest font-semibold">
        {icon} {label}
      </div>
      <div className="text-lg font-bold mt-1">{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail Sheet
// ---------------------------------------------------------------------------

function ReturnDetailSheet({
  row, onClose, onUpdate, adminUserId, busy,
}: {
  row: ReturnRow;
  onClose: () => void;
  onUpdate: (patch: Record<string, any>) => Promise<any>;
  adminUserId: string | null;
  busy: boolean;
}) {
  const [adminNotes, setAdminNotes] = useState(row.admin_notes || "");
  const [refundAmount, setRefundAmount] = useState<number>(Number(row.refund_amount) || 0);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [refundConfirmOpen, setRefundConfirmOpen] = useState(false);

  const status = row.return_status;
  const items = Array.isArray(row.items_returned) ? row.items_returned : [];

  const saveNotes = () => {
    if (adminNotes === (row.admin_notes || "")) return;
    onUpdate({ admin_notes: adminNotes.trim() || null }).then(() => toast.success("Notes saved"));
  };

  const approve = () =>
    onUpdate({ status: "approved", approved_at: new Date().toISOString(), approved_by: adminUserId })
      .then(() => toast.success("Return approved"));

  const submitReject = () => {
    if (!rejectReason.trim()) { toast.error("Please enter a rejection reason."); return; }
    onUpdate({ status: "rejected", rejection_reason: rejectReason.trim() })
      .then(() => { toast.success("Return rejected"); setRejectOpen(false); setRejectReason(""); });
  };

  const restoreStock = () =>
    onUpdate({ status: "stock_restored", stock_restored: true })
      .then(() => toast.success("Stock restoration recorded"));

  const skipStock = () =>
    onUpdate({ stock_restored: false }).then(() => toast.success("Stock restoration skipped"));

  const confirmRefund = () =>
    onUpdate({
      status: "refund_issued",
      refund_amount: refundAmount,
      refund_issued: true,
      refunded_at: new Date().toISOString(),
    }).then(() => { toast.success("Refund issued"); setRefundConfirmOpen(false); });

  const complete = () =>
    onUpdate({ status: "completed", completed_at: new Date().toISOString() })
      .then(() => toast.success("Return completed"));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="flex-1 bg-foreground/40" onClick={onClose} />
      <aside className="w-full max-w-[520px] h-full bg-background border-l border-border overflow-y-auto">
        <header className="sticky top-0 bg-card border-b border-border px-5 py-3 flex items-center justify-between z-10">
          <div>
            <h2 className="font-bold text-sm">Return — {row.order_number || row.order_id.slice(0, 8)}</h2>
            <p className="text-[10px] text-text-light">Created {new Date(row.created_at).toLocaleString("en-NG")}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-5 space-y-5">
          {/* Order */}
          <section>
            <h3 className="text-[10px] uppercase tracking-widest font-semibold text-text-med mb-2">Order details</h3>
            <dl className="text-xs space-y-1">
              <Row k="Order #" v={row.order_number || "—"} />
              <Row k="Customer" v={row.customer_name || "—"} />
              <Row k="Phone" v={row.customer_phone || "—"} />
              <Row k="Email" v={row.customer_email || "—"} />
              <Row k="Order total" v={fmt(row.order_total)} />
              <Row k="Payment method" v={row.payment_method || "—"} />
            </dl>
          </section>

          {/* Return details */}
          <section>
            <h3 className="text-[10px] uppercase tracking-widest font-semibold text-text-med mb-2">Return details</h3>
            <dl className="text-xs space-y-1">
              <Row k="Reason" v={row.return_reason || "—"} />
              <Row k="Type" v={TYPE_LABEL[row.return_type || ""] || row.return_type || "—"} />
              <Row k="Stock restored" v={row.stock_restored ? "Yes" : "No"} />
              {row.rejection_reason && <Row k="Rejection" v={row.rejection_reason} />}
            </dl>
            {items.length > 0 && (
              <div className="mt-2">
                <div className="text-[10px] uppercase tracking-widest font-semibold text-text-med mb-1">Items returned</div>
                <ul className="space-y-1 text-xs">
                  {items.map((it: any, i: number) => (
                    <li key={i} className="flex items-center justify-between bg-muted/40 rounded-md px-2 py-1.5">
                      <span className="truncate">{it.product_name || it.name || "Item"} × {it.quantity || it.qty || 1}</span>
                      <span className="tabular-nums text-text-med">{fmt(it.refund_amount || it.line_total || 0)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Timeline */}
          <section>
            <h3 className="text-[10px] uppercase tracking-widest font-semibold text-text-med mb-2">Timeline</h3>
            <ol className="border-l-2 border-border pl-4 space-y-2 text-xs">
              <TL active label="Requested" when={row.created_at} />
              <TL active={!!row.approved_at || ["approved","stock_restored","refund_issued","completed"].includes(status)} label="Approved" when={row.approved_at} />
              <TL active={!!row.stock_restored} label="Stock restored" when={row.stock_restored ? (row.approved_at || null) : null} />
              <TL active={!!row.refunded_at || ["refund_issued","completed"].includes(status)} label="Refund issued" when={row.refunded_at} />
              <TL active={!!row.completed_at || status === "completed"} label="Completed" when={row.completed_at} />
            </ol>
          </section>

          {/* Admin notes */}
          <section>
            <label className="text-[10px] uppercase tracking-widest font-semibold text-text-med block mb-1">Admin notes</label>
            <textarea
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="Internal notes for this return…"
              rows={3}
              className="w-full border border-input rounded-lg px-2 py-1.5 text-xs bg-background"
            />
          </section>

          {/* Actions per status */}
          <section className="space-y-2">
            <h3 className="text-[10px] uppercase tracking-widest font-semibold text-text-med">Actions</h3>

            {status === "requested" && (
              <div className="flex flex-wrap gap-2">
                <button onClick={approve} disabled={busy}
                  className="inline-flex items-center gap-1.5 bg-forest text-primary-foreground px-3 py-2 rounded-lg text-xs font-semibold hover:bg-forest-deep disabled:opacity-40">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </button>
                <button onClick={() => setRejectOpen(true)} disabled={busy}
                  className="inline-flex items-center gap-1.5 border border-destructive text-destructive px-3 py-2 rounded-lg text-xs font-semibold hover:bg-destructive/10 disabled:opacity-40">
                  <Ban className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            )}

            {status === "approved" && (
              <div className="flex flex-wrap gap-2">
                <button onClick={restoreStock} disabled={busy}
                  className="inline-flex items-center gap-1.5 bg-forest text-primary-foreground px-3 py-2 rounded-lg text-xs font-semibold hover:bg-forest-deep disabled:opacity-40">
                  <PackageCheck className="w-3.5 h-3.5" /> Restore stock
                </button>
                <button onClick={skipStock} disabled={busy}
                  className="inline-flex items-center gap-1.5 border border-border text-text-med px-3 py-2 rounded-lg text-xs font-semibold hover:bg-muted">
                  Skip stock restoration
                </button>
              </div>
            )}

            {(status === "approved" || status === "stock_restored") && (
              <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] uppercase tracking-widest font-semibold text-text-med">Refund amount</label>
                  <div className="flex items-center gap-1">
                    <span className="text-text-light text-xs">₦</span>
                    <input type="number" min={0} value={refundAmount} onChange={e => setRefundAmount(Number(e.target.value) || 0)}
                      className="w-32 border border-input rounded-lg px-2 py-1.5 text-xs bg-background" />
                  </div>
                </div>
                <button onClick={() => setRefundConfirmOpen(true)} disabled={busy || refundAmount <= 0}
                  className="inline-flex items-center gap-1.5 bg-forest text-primary-foreground px-3 py-2 rounded-lg text-xs font-semibold hover:bg-forest-deep disabled:opacity-40">
                  <Wallet className="w-3.5 h-3.5" /> Issue refund
                </button>
              </div>
            )}

            {status === "refund_issued" && (
              <button onClick={complete} disabled={busy}
                className="inline-flex items-center gap-1.5 bg-forest text-primary-foreground px-3 py-2 rounded-lg text-xs font-semibold hover:bg-forest-deep disabled:opacity-40">
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark completed
              </button>
            )}
          </section>
        </div>
      </aside>

      {/* Reject modal */}
      {rejectOpen && (
        <div className="fixed inset-0 z-[60] bg-foreground/50 flex items-center justify-center p-4" onClick={() => setRejectOpen(false)}>
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-sm mb-3">Reject return</h3>
            <label className="text-[10px] uppercase tracking-widest font-semibold text-text-med block mb-1">Reason (required)</label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              className="w-full border border-input rounded-lg px-2 py-1.5 text-xs bg-background"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setRejectOpen(false)} className="text-xs text-text-med hover:text-foreground">Cancel</button>
              <button onClick={submitReject} disabled={busy}
                className="inline-flex items-center gap-1.5 bg-destructive text-primary-foreground px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-40">
                Confirm rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund confirm modal */}
      {refundConfirmOpen && (
        <div className="fixed inset-0 z-[60] bg-foreground/50 flex items-center justify-center p-4" onClick={() => setRefundConfirmOpen(false)}>
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-sm mb-2">Issue refund</h3>
            <p className="text-xs text-text-med mb-3">
              Issue a refund of <b>{fmt(refundAmount)}</b> to <b>{row.customer_name || "customer"}</b>?
            </p>
            <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
              Paystack refunds must be processed manually in your Paystack dashboard. This action records the refund on the order.
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setRefundConfirmOpen(false)} className="text-xs text-text-med hover:text-foreground">Cancel</button>
              <button onClick={confirmRefund} disabled={busy}
                className="inline-flex items-center gap-1.5 bg-forest text-primary-foreground px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-40">
                Confirm refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-text-light">{k}</dt>
      <dd className="font-medium text-right truncate">{v}</dd>
    </div>
  );
}

function TL({ active, label, when }: { active: boolean; label: string; when: string | null | undefined }) {
  return (
    <li className="relative">
      <span className={`absolute -left-[21px] top-0.5 inline-block w-3 h-3 rounded-full border-2 border-card ${active ? "bg-forest" : "bg-muted"}`} />
      <div className={`${active ? "text-foreground" : "text-text-light"}`}>
        <span className="font-semibold">{label}</span>
        {when && <span className="text-text-light ml-2">— {new Date(when).toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}
      </div>
    </li>
  );
}

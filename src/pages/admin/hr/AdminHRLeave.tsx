import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/useAdminPermissionsContext";
import {
  useLeaveRequests, useLeaveBalances, useLeaveTypes, useHREmployees, useHRDepartments,
  useUpdateLeaveRequest, STATUS_COLORS, type HRLeaveRequest,
} from "@/hooks/useHR";

const inputCls = "w-full border border-input rounded-lg px-3 py-2 text-sm bg-background";
const labelCls = "text-[10px] uppercase tracking-widest font-semibold text-text-med block mb-1";

export default function AdminHRLeave() {
  const [tab, setTab] = useState<"pending" | "all" | "balances">("pending");
  return (
    <div className="space-y-3">
      <nav className="flex gap-1 border-b border-border">
        {[
          { k: "pending" as const,  label: "Pending approval" },
          { k: "all" as const,      label: "All requests" },
          { k: "balances" as const, label: "Leave balances" },
        ].map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`px-3 py-2 text-xs font-semibold border-b-2 -mb-px ${tab === t.k ? "border-forest text-forest" : "border-transparent text-text-med hover:text-forest"}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "pending" && <PendingTab />}
      {tab === "all" && <AllRequestsTab />}
      {tab === "balances" && <BalancesTab />}
    </div>
  );
}

function PendingTab() {
  const { data = [] } = useLeaveRequests();
  const pendingMgr = data.filter(r => r.status === "pending_manager");
  const pendingHr  = data.filter(r => r.status === "pending_hr");

  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-[10px] uppercase tracking-widest font-bold text-text-med mb-2">Awaiting manager approval ({pendingMgr.length})</h3>
        <div className="space-y-2">
          {pendingMgr.length === 0 && <p className="text-xs text-text-light">Nothing waiting on managers.</p>}
          {pendingMgr.map(r => <RequestCard key={r.id} request={r} stage="manager" />)}
        </div>
      </section>

      <section>
        <h3 className="text-[10px] uppercase tracking-widest font-bold text-text-med mb-2">Awaiting HR approval ({pendingHr.length})</h3>
        <div className="space-y-2">
          {pendingHr.length === 0 && <p className="text-xs text-text-light">Nothing waiting on HR.</p>}
          {pendingHr.map(r => <RequestCard key={r.id} request={r} stage="hr" />)}
        </div>
      </section>
    </div>
  );
}

function RequestCard({ request: r, stage }: { request: HRLeaveRequest; stage: "manager" | "hr" }) {
  const { adminUser } = usePermissions();
  const update = useUpdateLeaveRequest();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");

  const approve = async () => {
    const nowIso = new Date().toISOString();
    const payload: Partial<HRLeaveRequest> & { id: string } =
      stage === "manager"
        ? { id: r.id, manager_status: "approved", status: "pending_hr", manager_action_at: nowIso, manager_action_by: adminUser?.id || null }
        : { id: r.id, hr_status: "approved", status: "approved", hr_action_at: nowIso, hr_action_by: adminUser?.id || null };
    await update.mutateAsync(payload);
    toast.success("Approved");
  };

  const reject = async () => {
    if (!note.trim()) { toast.error("Rejection note is required."); return; }
    const nowIso = new Date().toISOString();
    const payload: Partial<HRLeaveRequest> & { id: string } =
      stage === "manager"
        ? { id: r.id, manager_status: "rejected", status: "rejected", manager_action_at: nowIso, manager_action_by: adminUser?.id || null, manager_notes: note, rejection_reason: note }
        : { id: r.id, hr_status: "rejected", status: "rejected", hr_action_at: nowIso, hr_action_by: adminUser?.id || null, hr_notes: note, rejection_reason: note };
    await update.mutateAsync(payload);
    toast.success("Rejected");
    setRejectOpen(false); setNote("");
  };

  return (
    <article className="bg-card border border-border rounded-xl p-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="font-semibold text-sm">{r.hr_employees?.full_name || "Employee"} <span className="text-text-light text-xs">({r.hr_employees?.employee_id})</span></div>
          <div className="text-xs text-text-med mt-0.5">{r.hr_leave_types?.name || "Leave"} · {r.start_date} → {r.end_date} · {Number(r.days_count).toFixed(1)} day{Number(r.days_count) === 1 ? "" : "s"}</div>
          {r.reason && <p className="text-xs text-text-med mt-1 leading-relaxed">"{r.reason}"</p>}
          <div className="text-[10px] text-text-light mt-1">Submitted {r.created_at ? new Date(r.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={approve} disabled={update.isPending} className="inline-flex items-center gap-1 bg-forest text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-forest-deep disabled:opacity-40"><Check className="w-3.5 h-3.5" /> Approve</button>
          <button onClick={() => setRejectOpen(true)} disabled={update.isPending} className="inline-flex items-center gap-1 border border-destructive text-destructive px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-destructive/10"><XCircle className="w-3.5 h-3.5" /> Reject</button>
        </div>
      </div>

      {rejectOpen && (
        <div className="mt-3 border-t border-border pt-3">
          <label className={labelCls}>Reason / notes</label>
          <textarea rows={2} className={inputCls} value={note} onChange={e => setNote(e.target.value)} />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => { setRejectOpen(false); setNote(""); }} className="text-xs text-text-med hover:text-foreground px-2 py-1">Cancel</button>
            <button onClick={reject} disabled={update.isPending} className="bg-destructive text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-destructive/90 disabled:opacity-40">Confirm rejection</button>
          </div>
        </div>
      )}
    </article>
  );
}

function AllRequestsTab() {
  const { data = [] } = useLeaveRequests();
  const { data: employees = [] } = useHREmployees();
  const { data: leaveTypes = [] } = useLeaveTypes();
  const [empFilter, setEmpFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const filtered = useMemo(() => {
    return data.filter(r => {
      if (empFilter && r.employee_id !== empFilter) return false;
      if (typeFilter && r.leave_type_id !== typeFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (from && r.end_date < from) return false;
      if (to && r.start_date > to) return false;
      return true;
    });
  }, [data, empFilter, typeFilter, statusFilter, from, to]);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-wrap">
        <select value={empFilter} onChange={e => setEmpFilter(e.target.value)} className="border border-input rounded px-2 py-1 text-xs bg-background">
          <option value="">All employees</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-input rounded px-2 py-1 text-xs bg-background">
          <option value="">All types</option>
          {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-input rounded px-2 py-1 text-xs bg-background">
          <option value="">All statuses</option>
          {["pending_manager","pending_hr","approved","rejected","cancelled"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border border-input rounded px-2 py-1 text-xs bg-background" />
        <span className="text-text-light text-xs">→</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border border-input rounded px-2 py-1 text-xs bg-background" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-3 py-2">Employee</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Dates</th>
              <th className="px-3 py-2 text-right">Days</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2">{r.hr_employees?.full_name}</td>
                <td className="px-3 py-2">{r.hr_leave_types?.name}</td>
                <td className="px-3 py-2 text-text-light">{r.start_date} → {r.end_date}</td>
                <td className="px-3 py-2 text-right tabular-nums">{Number(r.days_count).toFixed(1)}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-pill text-[10px] font-semibold capitalize ${STATUS_COLORS[r.status] || "bg-muted text-text-med"}`}>{r.status.replace("_", " ")}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-text-light">No requests match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BalancesTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const { data = [] } = useLeaveBalances(year);
  const { data: departments = [] } = useHRDepartments();
  const { data: employees = [] } = useHREmployees();
  const [deptFilter, setDeptFilter] = useState("");
  const [empFilter, setEmpFilter] = useState("");
  const [editing, setEditing] = useState<{ id: string; value: number } | null>(null);

  const visible = useMemo(() => {
    let rows = data;
    if (empFilter) rows = rows.filter(r => r.employee_id === empFilter);
    if (deptFilter) {
      const deptEmpIds = new Set(employees.filter(e => e.department_id === deptFilter).map(e => e.id));
      rows = rows.filter(r => deptEmpIds.has(r.employee_id));
    }
    return rows;
  }, [data, empFilter, deptFilter, employees]);

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await (supabase as any).from("hr_leave_balances").update({
      entitled_days: editing.value, updated_at: new Date().toISOString(),
    }).eq("id", editing.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Entitlement updated");
    setEditing(null);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-wrap">
        <input type="number" value={year} onChange={e => setYear(Number(e.target.value) || now.getFullYear())} className="w-24 border border-input rounded px-2 py-1 text-xs bg-background" />
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="border border-input rounded px-2 py-1 text-xs bg-background">
          <option value="">All departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={empFilter} onChange={e => setEmpFilter(e.target.value)} className="border border-input rounded px-2 py-1 text-xs bg-background">
          <option value="">All employees</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-3 py-2">Employee</th>
              <th className="px-3 py-2">Leave type</th>
              <th className="px-3 py-2 text-right">Entitled</th>
              <th className="px-3 py-2 text-right">Used</th>
              <th className="px-3 py-2 text-right">Pending</th>
              <th className="px-3 py-2 text-right">Remaining</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(b => {
              const remaining = Number(b.entitled_days) - Number(b.used_days) - Number(b.pending_days);
              const isEditing = editing?.id === b.id;
              return (
                <tr key={b.id} className="border-t border-border">
                  <td className="px-3 py-2">{b.hr_employees?.full_name}</td>
                  <td className="px-3 py-2">{b.hr_leave_types?.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {isEditing ? (
                      <input type="number" min={0} step={0.5} value={editing!.value} onChange={e => setEditing({ id: editing!.id, value: Number(e.target.value) })} className="w-20 border border-input rounded px-2 py-0.5 text-xs bg-background" />
                    ) : Number(b.entitled_days).toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{Number(b.used_days).toFixed(1)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{Number(b.pending_days).toFixed(1)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{remaining.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right">
                    {isEditing ? (
                      <>
                        <button onClick={saveEdit} className="text-forest font-semibold hover:underline mr-2">Save</button>
                        <button onClick={() => setEditing(null)} className="text-text-med hover:text-foreground">Cancel</button>
                      </>
                    ) : (
                      <button onClick={() => setEditing({ id: b.id, value: Number(b.entitled_days) })} className="text-forest font-semibold hover:underline">Edit entitlement</button>
                    )}
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-text-light">No balances.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

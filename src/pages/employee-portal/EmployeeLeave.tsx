import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, Send } from "lucide-react";
import {
  useMyEmployee, useMyLeaveRequests, useLeaveTypes, useMyLeaveBalances,
  useCreateLeaveRequest, useUpdateLeaveRequest,
  businessDaysBetween, STATUS_COLORS, type HRLeaveType,
} from "@/hooks/useHR";

const inputCls = "w-full border border-input rounded-lg px-3 py-2 text-sm bg-background";
const labelCls = "text-[10px] uppercase tracking-widest font-semibold text-text-med block mb-1";

export default function EmployeeLeave() {
  const { data: employee } = useMyEmployee();
  const [tab, setTab] = useState<"mine" | "apply">("mine");

  return (
    <div className="space-y-3">
      <h1 className="pf text-xl font-bold flex items-center gap-2"><CalendarCheck className="w-5 h-5" /> Leave</h1>
      <nav className="flex gap-1 border-b border-border">
        {[
          { k: "mine" as const,  label: "My leave requests" },
          { k: "apply" as const, label: "Apply for leave" },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`px-3 py-2 text-xs font-semibold border-b-2 -mb-px ${tab === t.k ? "border-forest text-forest" : "border-transparent text-text-med hover:text-forest"}`}>
            {t.label}
          </button>
        ))}
      </nav>
      {tab === "mine" && <MyRequestsTab employeeId={employee?.id || null} />}
      {tab === "apply" && <ApplyTab employee={employee} />}
    </div>
  );
}

function MyRequestsTab({ employeeId }: { employeeId: string | null }) {
  const { data } = useMyLeaveRequests(employeeId);
  const update = useUpdateLeaveRequest();

  const cancel = async (id: string) => {
    if (!confirm("Cancel this leave request?")) return;
    try { await update.mutateAsync({ id, status: "cancelled" }); toast.success("Request cancelled"); }
    catch (e: any) { toast.error(e?.message || "Failed"); }
  };

  return (
    <div className="bg-card border border-border rounded-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Dates</th>
              <th className="px-3 py-2 text-right">Days</th>
              <th className="px-3 py-2">Stage</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {(!data || data.length === 0) && <tr><td colSpan={6} className="px-3 py-6 text-center text-text-light">No leave requests yet.</td></tr>}
            {(data || []).map(r => {
              const mgr = r.manager_status === "approved" ? "✓" : r.manager_status === "rejected" ? "✗" : "•";
              const hr  = r.hr_status === "approved" ? "✓" : r.hr_status === "rejected" ? "✗" : "•";
              const canCancel = r.status === "pending_manager" || r.status === "pending_hr";
              return (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2">{r.hr_leave_types?.name || "Leave"}</td>
                  <td className="px-3 py-2 text-text-light">{r.start_date} → {r.end_date}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{Number(r.days_count).toFixed(1)}</td>
                  <td className="px-3 py-2">
                    <span className="text-text-med">Mgr {mgr}</span>
                    <span className="mx-1 text-text-light">/</span>
                    <span className="text-text-med">HR {hr}</span>
                  </td>
                  <td className="px-3 py-2"><span className={`inline-flex px-2 py-0.5 rounded-pill text-[10px] font-semibold capitalize ${STATUS_COLORS[r.status] || "bg-muted text-text-med"}`}>{r.status.replace("_", " ")}</span></td>
                  <td className="px-3 py-2 text-right">
                    {canCancel ? (
                      <button onClick={() => cancel(r.id)} className="text-destructive hover:underline font-semibold">Cancel</button>
                    ) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApplyTab({ employee }: { employee: { id: string; gender: string | null; line_manager_id: string | null } | null | undefined }) {
  const year = new Date().getFullYear();
  const { data: leaveTypes = [] } = useLeaveTypes();
  const { data: balances } = useMyLeaveBalances(employee?.id || null, year);
  const create = useCreateLeaveRequest();

  // Filter out gender-specific types that don't match the employee's gender.
  const availableTypes: HRLeaveType[] = leaveTypes.filter(t => {
    if (!t.gender_specific) return true;
    if (!employee?.gender) return true;
    return t.gender_specific === employee.gender;
  });

  const [typeId, setTypeId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");

  const days = businessDaysBetween(start, end);
  const balance = balances?.find(b => b.leave_type_id === typeId);
  const remaining = balance ? Number(balance.entitled_days) - Number(balance.used_days) - Number(balance.pending_days) : null;
  const overBudget = remaining != null && days > remaining;

  const submit = async () => {
    if (!employee?.id) { toast.error("Your employee profile isn't linked yet."); return; }
    if (!typeId) { toast.error("Pick a leave type."); return; }
    if (!start || !end) { toast.error("Pick both start and end dates."); return; }
    if (new Date(end) < new Date(start)) { toast.error("End date must be on or after start date."); return; }
    if (days <= 0) { toast.error("That range has no business days."); return; }

    try {
      await create.mutateAsync({
        employee_id: employee.id,
        leave_type_id: typeId,
        start_date: start,
        end_date: end,
        days_count: days,
        reason: reason.trim() || null,
        manager_id: employee.line_manager_id || null,
        status: "pending_manager",
        manager_status: "pending",
        hr_status: "pending",
      });
      toast.success("Leave request submitted. Your manager has been notified.");
      setTypeId(""); setStart(""); setEnd(""); setReason("");
    } catch (e: any) {
      toast.error(e?.message || "Could not submit leave request.");
    }
  };

  return (
    <div className="bg-card border border-border rounded-card p-4 space-y-3 max-w-[520px]">
      <div>
        <label className={labelCls}>Leave type</label>
        <select value={typeId} onChange={e => setTypeId(e.target.value)} className={inputCls}>
          <option value="">Select…</option>
          {availableTypes.map(t => <option key={t.id} value={t.id}>{t.name}{t.is_paid === false ? " (unpaid)" : ""}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Start date</label>
          <input type="date" value={start} onChange={e => setStart(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>End date</label>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} min={start || undefined} className={inputCls} />
        </div>
      </div>

      <div className="text-[11px] text-text-light flex items-center justify-between">
        <span>Business days: <b className="text-foreground">{days}</b> (excludes weekends)</span>
        {balance && (
          <span>
            Remaining: <b className="text-foreground">{Number(remaining).toFixed(1)}</b> · Used {Number(balance.used_days).toFixed(1)} · Pending {Number(balance.pending_days).toFixed(1)}
          </span>
        )}
      </div>
      {overBudget && (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
          ⚠ You're requesting more days than you have remaining for this leave type.
        </p>
      )}

      <div>
        <label className={labelCls}>Reason</label>
        <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Brief reason for your manager" className={inputCls} />
      </div>

      <div className="flex justify-end">
        <button onClick={submit} disabled={create.isPending} className="inline-flex items-center gap-1.5 bg-forest text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-forest-deep disabled:opacity-40">
          <Send className="w-4 h-4" /> Submit request
        </button>
      </div>
    </div>
  );
}

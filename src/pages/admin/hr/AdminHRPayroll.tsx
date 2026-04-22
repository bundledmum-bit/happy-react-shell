import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { X, Save, CheckCircle2, Wallet, Calendar, History } from "lucide-react";
import { usePermissions } from "@/hooks/useAdminPermissionsContext";
import {
  useHREmployees, usePayrollRuns, useUpsertPayrollRun,
  useApprovePayrollRun, useMarkPayrollPaid,
  rollupPayroll, fmtN, fromKobo, toKobo, MONTHS, STATUS_COLORS,
  type HREmployee, type HRPayrollRun,
} from "@/hooks/useHR";

const inputCls = "w-full border border-input rounded-lg px-3 py-2 text-sm bg-background";
const labelCls = "text-[10px] uppercase tracking-widest font-semibold text-text-med block mb-1";
const btnPrimary = "inline-flex items-center gap-1.5 bg-forest text-primary-foreground px-3 py-2 rounded-lg text-xs font-semibold hover:bg-forest-deep disabled:opacity-40";

export default function AdminHRPayroll() {
  const now = new Date();
  const [tab, setTab] = useState<"run" | "history">("run");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: employees = [] } = useHREmployees();
  const activeEmployees = employees.filter(e => e.status === "active");
  const { data: runs = [] } = usePayrollRuns(year, month);
  const { data: allRuns = [] } = usePayrollRuns();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="inline-flex rounded-lg bg-muted p-0.5 text-xs">
          <button onClick={() => setTab("run")} className={`px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 ${tab === "run" ? "bg-card font-semibold" : ""}`}>
            <Wallet className="w-3.5 h-3.5" /> Monthly run
          </button>
          <button onClick={() => setTab("history")} className={`px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 ${tab === "history" ? "bg-card font-semibold" : ""}`}>
            <History className="w-3.5 h-3.5" /> History
          </button>
        </div>

        {tab === "run" && (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-text-light" />
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border border-input rounded-lg px-2 py-1.5 text-xs bg-background">
              {MONTHS.map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
            </select>
            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="w-24 border border-input rounded-lg px-2 py-1.5 text-xs bg-background" />
          </div>
        )}
      </div>

      {tab === "run" && (
        <MonthlyRunView year={year} month={month} activeEmployees={activeEmployees} runs={runs} />
      )}
      {tab === "history" && <HistoryView runs={allRuns} employees={employees} />}
    </div>
  );
}

function MonthlyRunView({ year, month, activeEmployees, runs }: {
  year: number; month: number; activeEmployees: HREmployee[]; runs: HRPayrollRun[];
}) {
  const { adminUser, can } = usePermissions();
  const upsert = useUpsertPayrollRun();
  const approve = useApprovePayrollRun();
  const markPaid = useMarkPayrollPaid();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<{ run?: HRPayrollRun; employee: HREmployee } | null>(null);
  const [paying, setPaying] = useState<HRPayrollRun | null>(null);

  const rows = useMemo(() => {
    return activeEmployees.map(emp => {
      const run = runs.find(r => r.employee_id === emp.id);
      return { emp, run };
    });
  }, [activeEmployees, runs]);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Employee</th>
              <th className="px-3 py-2">Dept</th>
              <th className="px-3 py-2 text-right">Gross</th>
              <th className="px-3 py-2 text-right">Deductions</th>
              <th className="px-3 py-2 text-right">Net</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ emp, run }) => (
              <tr key={emp.id} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-text-med">{emp.employee_id}</td>
                <td className="px-3 py-2 font-semibold">{emp.full_name}</td>
                <td className="px-3 py-2">{emp.hr_departments?.name || "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{run ? fmtN(run.gross_salary) : "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{run ? fmtN(run.total_deductions) : "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold">{run ? fmtN(run.net_salary) : "—"}</td>
                <td className="px-3 py-2">
                  {run ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-semibold capitalize ${STATUS_COLORS[run.status] || "bg-muted text-text-med"}`}>{run.status}</span>
                  ) : (
                    <span className="text-text-light text-[10px]">No run</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  {!run && (
                    <button onClick={() => setEditing({ employee: emp })} className="text-forest text-xs font-semibold hover:underline">Create run</button>
                  )}
                  {run && run.status === "draft" && can("finance", "edit_payroll") && (
                    <>
                      <button onClick={() => setEditing({ run, employee: emp })} className="text-forest text-xs font-semibold hover:underline mr-2">Edit</button>
                      <button onClick={() => approve.mutateAsync({ id: run.id, approvedBy: adminUser?.id || null }).then(() => toast.success("Approved"))} className="text-emerald-700 text-xs font-semibold hover:underline">Approve</button>
                    </>
                  )}
                  {run && run.status === "approved" && (
                    <button onClick={() => setPaying(run)} className="inline-flex items-center gap-1 text-xs font-semibold bg-forest text-primary-foreground px-2.5 py-1 rounded-md hover:bg-forest-deep"><CheckCircle2 className="w-3 h-3" /> Mark paid</button>
                  )}
                  {run && run.status === "paid" && (
                    <span className="text-emerald-700 text-[10px] font-semibold">Paid {run.payment_date || ""}</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-text-light">No active employees for this month.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && (
        <PayrollEntryModal
          employee={editing.employee}
          run={editing.run}
          year={year}
          month={month}
          onClose={() => setEditing(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["hr-payroll"] });
            setEditing(null);
          }}
        />
      )}

      {paying && (
        <MarkPaidModal
          run={paying}
          onClose={() => setPaying(null)}
          onConfirm={payload => markPaid.mutateAsync({ id: paying.id, paidBy: adminUser?.id || null, paymentMethod: payload.method, paymentReference: payload.ref || null })
            .then(() => { toast.success("Marked paid and payslip email queued"); setPaying(null); })
            .catch(e => toast.error(e?.message || "Failed"))}
          busy={markPaid.isPending}
        />
      )}
    </div>
  );
}

function HistoryView({ runs, employees }: { runs: HRPayrollRun[]; employees: HREmployee[] }) {
  const [empFilter, setEmpFilter] = useState("");
  const [yearFilter, setYearFilter] = useState<number | "">("");
  const [monthFilter, setMonthFilter] = useState<number | "">("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = useMemo(() => {
    return runs.filter(r => {
      if (empFilter && r.employee_id !== empFilter) return false;
      if (yearFilter && r.pay_year !== yearFilter) return false;
      if (monthFilter && r.pay_month !== monthFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      return true;
    });
  }, [runs, empFilter, yearFilter, monthFilter, statusFilter]);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-wrap">
        <select value={empFilter} onChange={e => setEmpFilter(e.target.value)} className="border border-input rounded px-2 py-1 text-xs bg-background">
          <option value="">All employees</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
        </select>
        <select value={String(monthFilter)} onChange={e => setMonthFilter(e.target.value === "" ? "" : Number(e.target.value))} className="border border-input rounded px-2 py-1 text-xs bg-background">
          <option value="">All months</option>
          {MONTHS.map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
        </select>
        <input type="number" placeholder="Year" value={yearFilter || ""} onChange={e => setYearFilter(e.target.value ? Number(e.target.value) : "")} className="w-24 border border-input rounded px-2 py-1 text-xs bg-background" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-input rounded px-2 py-1 text-xs bg-background">
          <option value="">All statuses</option>
          {["draft","approved","paid"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-3 py-2">Employee</th>
              <th className="px-3 py-2">Period</th>
              <th className="px-3 py-2 text-right">Gross</th>
              <th className="px-3 py-2 text-right">Net</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Paid on</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2 font-semibold">{r.hr_employees?.full_name || r.employee_id}</td>
                <td className="px-3 py-2">{MONTHS[r.pay_month - 1]} {r.pay_year}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtN(r.gross_salary)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmtN(r.net_salary)}</td>
                <td className="px-3 py-2"><span className={`inline-flex px-2 py-0.5 rounded-pill text-[10px] font-semibold capitalize ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                <td className="px-3 py-2 text-text-light">{r.payment_date || "—"}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-text-light">No payroll runs match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PayrollEntryModal({ employee, run, year, month, onClose, onSaved }: {
  employee: HREmployee;
  run?: HRPayrollRun;
  year: number;
  month: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const upsert = useUpsertPayrollRun();
  // Seed naira fields from the existing run, or from the employee defaults.
  const seed = run || ({
    basic_salary: employee.basic_salary,
    housing_allowance: employee.housing_allowance,
    transport_allowance: employee.transport_allowance,
    other_allowances: employee.other_allowances,
  } as Partial<HRPayrollRun>);

  const [v, setV] = useState({
    basic: fromKobo(seed.basic_salary),
    housing: fromKobo(seed.housing_allowance),
    transport: fromKobo(seed.transport_allowance),
    other: fromKobo(seed.other_allowances),
    bonus: fromKobo(run?.bonus),
    emp_pension: fromKobo(run?.employee_pension),
    nhf: fromKobo(run?.nhf_deduction),
    paye: fromKobo(run?.paye_tax),
    other_ded: fromKobo(run?.other_deductions),
    er_pension: fromKobo(run?.employer_pension),
    nsitf: fromKobo(run?.nsitf),
    itf: fromKobo(run?.itf),
    notes: run?.notes || "",
  });

  const set = (k: keyof typeof v, x: any) => setV(prev => ({ ...prev, [k]: x }));

  // Live roll-up
  const rolled = rollupPayroll({
    basic_salary: toKobo(v.basic),
    housing_allowance: toKobo(v.housing),
    transport_allowance: toKobo(v.transport),
    other_allowances: toKobo(v.other),
    bonus: toKobo(v.bonus),
    employee_pension: toKobo(v.emp_pension),
    nhf_deduction: toKobo(v.nhf),
    paye_tax: toKobo(v.paye),
    other_deductions: toKobo(v.other_ded),
    employer_pension: toKobo(v.er_pension),
    nsitf: toKobo(v.nsitf),
    itf: toKobo(v.itf),
  });

  const save = async () => {
    try {
      await upsert.mutateAsync({
        ...(run?.id ? { id: run.id } : {}),
        employee_id: employee.id,
        pay_month: month,
        pay_year: year,
        basic_salary: toKobo(v.basic),
        housing_allowance: toKobo(v.housing),
        transport_allowance: toKobo(v.transport),
        other_allowances: toKobo(v.other),
        bonus: toKobo(v.bonus),
        employee_pension: toKobo(v.emp_pension),
        nhf_deduction: toKobo(v.nhf),
        paye_tax: toKobo(v.paye),
        other_deductions: toKobo(v.other_ded),
        employer_pension: toKobo(v.er_pension),
        nsitf: toKobo(v.nsitf),
        itf: toKobo(v.itf),
        notes: v.notes.trim() || null,
        status: run?.status || "draft",
      } as any);
      toast.success("Payroll run saved");
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[92svh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b border-border px-5 py-3 flex items-center justify-between z-10">
          <div>
            <h3 className="font-bold text-sm">{run ? "Edit" : "Create"} payroll run</h3>
            <p className="text-[10px] text-text-light">{employee.full_name} · {MONTHS[month - 1]} {year}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <section>
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-text-med mb-2">Income (₦)</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Num label="Basic" v={v.basic} onChange={x => set("basic", x)} />
              <Num label="Housing" v={v.housing} onChange={x => set("housing", x)} />
              <Num label="Transport" v={v.transport} onChange={x => set("transport", x)} />
              <Num label="Other" v={v.other} onChange={x => set("other", x)} />
              <Num label="Bonus" v={v.bonus} onChange={x => set("bonus", x)} />
            </div>
            <p className="text-[11px] text-text-light mt-1">Gross salary (auto): <b className="tabular-nums text-foreground">{fmtN(rolled.gross_salary)}</b></p>
          </section>

          <section>
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-text-med mb-2">Deductions (₦)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Num label="Employee pension" v={v.emp_pension} onChange={x => set("emp_pension", x)} />
              <Num label="NHF" v={v.nhf} onChange={x => set("nhf", x)} />
              <Num label="PAYE tax" v={v.paye} onChange={x => set("paye", x)} />
              <Num label="Other" v={v.other_ded} onChange={x => set("other_ded", x)} />
            </div>
            <p className="text-[11px] text-text-light mt-1">
              Total deductions: <b className="tabular-nums text-foreground">{fmtN(rolled.total_deductions)}</b> · Net: <b className="tabular-nums text-forest">{fmtN(rolled.net_salary)}</b>
            </p>
          </section>

          <section>
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-text-med mb-2">Employer costs (₦)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <Num label="Employer pension" v={v.er_pension} onChange={x => set("er_pension", x)} />
              <Num label="NSITF" v={v.nsitf} onChange={x => set("nsitf", x)} />
              <Num label="ITF" v={v.itf} onChange={x => set("itf", x)} />
            </div>
            <p className="text-[11px] text-text-light mt-1">Total employer cost: <b className="tabular-nums">{fmtN(rolled.total_employer_cost)}</b></p>
          </section>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea rows={2} className={inputCls} value={v.notes} onChange={e => set("notes", e.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="text-xs text-text-med hover:text-foreground px-3 py-2">Cancel</button>
            <button onClick={save} disabled={upsert.isPending} className={btnPrimary}><Save className="w-3.5 h-3.5" /> Save draft</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Num({ label, v, onChange }: { label: string; v: number | string; onChange: (x: number) => void }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input type="number" min={0} value={v} onChange={e => onChange(Number(e.target.value) || 0)} className={inputCls} />
    </div>
  );
}

function MarkPaidModal({ run, onClose, onConfirm, busy }: {
  run: HRPayrollRun;
  onClose: () => void;
  onConfirm: (payload: { method: string; ref: string }) => Promise<any>;
  busy: boolean;
}) {
  const [method, setMethod] = useState("bank_transfer");
  const [ref, setRef] = useState("");
  return (
    <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm">Mark as paid</h3>
          <button onClick={onClose} aria-label="Close" className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
        </div>
        <div className="p-5 space-y-2 text-sm">
          <p>Net salary: <b className="tabular-nums">{fmtN(run.net_salary)}</b></p>
          <div>
            <label className={labelCls}>Payment method</label>
            <select value={method} onChange={e => setMethod(e.target.value)} className={inputCls}>
              <option value="bank_transfer">Bank transfer</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Reference (optional)</label>
            <input value={ref} onChange={e => setRef(e.target.value)} className={inputCls} placeholder="Bank ref / cheque number" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="text-xs text-text-med hover:text-foreground px-3 py-2">Cancel</button>
            <button onClick={() => onConfirm({ method, ref })} disabled={busy} className={btnPrimary}><CheckCircle2 className="w-3.5 h-3.5" /> Confirm</button>
          </div>
        </div>
      </div>
    </div>
  );
}

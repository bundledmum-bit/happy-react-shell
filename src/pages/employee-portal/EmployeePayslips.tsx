import { useState } from "react";
import { Printer, X, Wallet } from "lucide-react";
import { useMyEmployee, useMyPayrollRuns, fmtN, MONTHS, STATUS_COLORS, type HRPayrollRun } from "@/hooks/useHR";

export default function EmployeePayslips() {
  const { data: employee } = useMyEmployee();
  const { data, isLoading } = useMyPayrollRuns(employee?.id || null);
  const [detail, setDetail] = useState<HRPayrollRun | null>(null);

  return (
    <div className="space-y-3">
      <h1 className="pf text-xl font-bold flex items-center gap-2"><Wallet className="w-5 h-5" /> My payslips</h1>
      <div className="bg-card border border-border rounded-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs">
              <tr className="text-left">
                <th className="px-3 py-2">Period</th>
                <th className="px-3 py-2 text-right">Gross</th>
                <th className="px-3 py-2 text-right">Net</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {isLoading && <tr><td colSpan={5} className="px-3 py-8 text-center text-text-light">Loading…</td></tr>}
              {!isLoading && (!data || data.length === 0) && <tr><td colSpan={5} className="px-3 py-8 text-center text-text-light">No payslips yet.</td></tr>}
              {(data || []).map(r => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2 font-semibold">{MONTHS[r.pay_month - 1]} {r.pay_year}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtN(r.gross_salary)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{fmtN(r.net_salary)}</td>
                  <td className="px-3 py-2"><span className={`inline-flex px-2 py-0.5 rounded-pill text-[10px] font-semibold capitalize ${STATUS_COLORS[r.status] || "bg-muted text-text-med"}`}>{r.status}</span></td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => setDetail(r)} className="text-forest text-xs font-semibold hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detail && <PayslipDetailSheet run={detail} employeeName={employee?.full_name || ""} onClose={() => setDetail(null)} />}
    </div>
  );
}

function PayslipDetailSheet({ run, employeeName, onClose }: { run: HRPayrollRun; employeeName: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="flex-1 bg-foreground/40 print:hidden" onClick={onClose} />
      <aside className="w-full max-w-[520px] h-full bg-background border-l border-border overflow-y-auto print:max-w-full print:border-0">
        <header className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3 flex items-center justify-between print:hidden">
          <div>
            <h2 className="font-bold text-sm">Payslip — {MONTHS[run.pay_month - 1]} {run.pay_year}</h2>
            <p className="text-[10px] text-text-light">{employeeName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-forest text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-forest-deep"><Printer className="w-3.5 h-3.5" /> Print</button>
            <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
          </div>
        </header>
        <section className="p-5 space-y-4 text-sm">
          <header className="hidden print:block">
            <h1 className="font-bold text-lg">BundledMum — Payslip</h1>
            <p className="text-xs">{employeeName} · {MONTHS[run.pay_month - 1]} {run.pay_year}</p>
          </header>
          <PayslipGroup title="Income">
            <Line label="Basic salary" v={run.basic_salary} />
            <Line label="Housing allowance" v={run.housing_allowance} />
            <Line label="Transport allowance" v={run.transport_allowance} />
            <Line label="Other allowances" v={run.other_allowances} />
            <Line label="Bonus" v={run.bonus} />
            <Total label="Gross salary" v={run.gross_salary} />
          </PayslipGroup>

          <PayslipGroup title="Deductions">
            <Line label="Employee pension" v={run.employee_pension} />
            <Line label="NHF" v={run.nhf_deduction} />
            <Line label="PAYE tax" v={run.paye_tax} />
            <Line label="Other" v={run.other_deductions} />
            <Total label="Total deductions" v={run.total_deductions} />
          </PayslipGroup>

          <PayslipGroup title="Net pay">
            <Total label="Net pay" v={run.net_salary} highlight />
          </PayslipGroup>

          <PayslipGroup title="Employer contributions">
            <Line label="Employer pension" v={run.employer_pension} />
            <Line label="NSITF" v={run.nsitf} />
            <Line label="ITF" v={run.itf} />
            <Total label="Total employer cost" v={run.total_employer_cost} />
          </PayslipGroup>

          <p className="text-[10px] text-text-light">
            Status: {run.status}{run.payment_date ? ` · Paid ${run.payment_date}` : ""}{run.payment_reference ? ` · Ref ${run.payment_reference}` : ""}
          </p>
        </section>
      </aside>
    </div>
  );
}

function PayslipGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-[10px] uppercase tracking-widest font-bold text-text-med mb-1">{title}</h3>
      <dl className="text-xs space-y-0.5">{children}</dl>
    </section>
  );
}
function Line({ label, v }: { label: string; v: number }) {
  return <div className="flex items-center justify-between py-0.5 border-b border-border/40 last:border-0"><dt className="text-text-med">{label}</dt><dd className="tabular-nums">{fmtN(v)}</dd></div>;
}
function Total({ label, v, highlight }: { label: string; v: number; highlight?: boolean }) {
  return <div className={`flex items-center justify-between pt-1 font-bold ${highlight ? "text-forest text-base" : ""}`}><dt>{label}</dt><dd className="tabular-nums">{fmtN(v)}</dd></div>;
}

import { fmtN, MONTHS, type HRPayrollRun } from "@/hooks/useHR";

/**
 * Full-page payslip used for print/PDF export. The `.payslip-print` wrapper
 * plus the global print CSS (see index.css) hide all other page chrome when
 * the user triggers window.print(). On screen it's wrapped in a read-only
 * sheet for preview.
 */
export default function PayslipPrint({
  run,
  employeeName,
  employeeId,
  jobTitle,
}: {
  run: HRPayrollRun;
  employeeName: string;
  employeeId?: string | null;
  jobTitle?: string | null;
}) {
  const period = `${MONTHS[run.pay_month - 1]} ${run.pay_year}`;
  const hasBonus = Number(run.bonus) > 0;

  return (
    <div className="payslip-print bg-white text-black p-8 max-w-[780px] mx-auto text-[13px] leading-snug">
      <header className="flex items-start justify-between pb-4 border-b border-black/20">
        <div>
          <div className="text-2xl font-black" style={{ color: "#E98074" }}>BundledMum</div>
          <div className="text-[11px] text-black/60 mt-0.5">hr@bundledmum.com · Lagos, Nigeria</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-black/50">Payslip</div>
          <div className="text-lg font-bold mt-0.5">{period}</div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 py-4 text-[12px]">
        <div>
          <div className="text-[10px] uppercase tracking-widest font-semibold text-black/50 mb-0.5">Employee</div>
          <div className="font-bold">{employeeName}</div>
          {employeeId && <div className="text-black/70">ID: {employeeId}</div>}
          {jobTitle && <div className="text-black/70">{jobTitle}</div>}
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest font-semibold text-black/50 mb-0.5">Payment</div>
          <div><span className="text-black/50">Date: </span>{run.payment_date || "—"}</div>
          {run.payment_method && <div><span className="text-black/50">Method: </span>{run.payment_method.replace(/_/g, " ")}</div>}
          {run.payment_reference && <div><span className="text-black/50">Ref: </span>{run.payment_reference}</div>}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-6 pt-2">
        {/* Earnings */}
        <div>
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-black/60 mb-1.5 border-b border-black/10 pb-1">Earnings</h3>
          <PSRow label="Basic Salary"        v={run.basic_salary} />
          <PSRow label="Housing Allowance"   v={run.housing_allowance} />
          <PSRow label="Transport Allowance" v={run.transport_allowance} />
          <PSRow label="Other Allowances"    v={run.other_allowances} />
          {hasBonus && <PSRow label="Bonus" v={run.bonus} />}
          <div className="border-t border-black/20 mt-1.5 pt-1.5">
            <PSRow label="Gross Salary" v={run.gross_salary} bold />
          </div>
        </div>

        {/* Deductions */}
        <div>
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-black/60 mb-1.5 border-b border-black/10 pb-1">Deductions</h3>
          <PSRow label="PAYE Tax"              v={run.paye_tax} />
          <PSRow label="Pension (Employee 8%)" v={run.employee_pension} />
          <PSRow label="NHF (2.5%)"            v={run.nhf_deduction} />
          {Number(run.other_deductions) > 0 && <PSRow label="Other Deductions" v={run.other_deductions} />}
          <div className="border-t border-black/20 mt-1.5 pt-1.5">
            <PSRow label="Total Deductions" v={run.total_deductions} bold />
          </div>
        </div>
      </section>

      {/* Net */}
      <section className="mt-4 rounded-lg border-2 border-emerald-700 bg-emerald-50 px-4 py-3 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-emerald-800">Net Salary</span>
        <span className="text-2xl font-black text-emerald-800 tabular-nums">{fmtN(run.net_salary)}</span>
      </section>

      {/* Employer costs */}
      <section className="mt-4 rounded-lg bg-black/5 px-4 py-3 text-[11px] text-black/60">
        <div className="text-[10px] uppercase tracking-widest font-bold mb-1">Employer Contributions (for information)</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
          <PSRow label="Employer Pension (10%)" v={run.employer_pension} compact />
          <PSRow label="NSITF (1%)"             v={run.nsitf} compact />
          <PSRow label="ITF (1%)"               v={run.itf} compact />
          <PSRow label="Total Employer Cost"    v={run.total_employer_cost} compact bold />
        </div>
      </section>

      <footer className="mt-6 pt-3 border-t border-black/10 text-[10px] text-black/50 text-center space-y-0.5">
        <p>This payslip is computer-generated and is valid without signature.</p>
        <p>BundledMum · hr@bundledmum.com · Lagos, Nigeria</p>
      </footer>
    </div>
  );
}

function PSRow({ label, v, bold, compact }: { label: string; v: number; bold?: boolean; compact?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${compact ? "py-0" : "py-0.5"} ${bold ? "font-bold" : ""}`}>
      <span className={bold ? "" : "text-black/70"}>{label}</span>
      <span className="tabular-nums">{fmtN(v)}</span>
    </div>
  );
}

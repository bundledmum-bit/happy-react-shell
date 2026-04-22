import { useState } from "react";
import { toast } from "sonner";
import { Printer, X, Wallet, Download } from "lucide-react";
import { useMyEmployee, useMyPayrollRuns, fmtN, MONTHS, STATUS_COLORS, type HRPayrollRun } from "@/hooks/useHR";
import PayslipPrint from "@/components/employee-portal/PayslipPrint";

export default function EmployeePayslips() {
  const { data: employee } = useMyEmployee();
  const { data, isLoading } = useMyPayrollRuns(employee?.id || null);
  const [detail, setDetail] = useState<HRPayrollRun | null>(null);
  const [printing, setPrinting] = useState<HRPayrollRun | null>(null);

  const startPrint = (run: HRPayrollRun) => {
    setPrinting(run);
    toast.message("Opening print dialog — select 'Save as PDF' to download your payslip.");
    // Wait one frame for the print tree to mount before calling print.
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        // Clear the overlay after the print dialog closes.
        setTimeout(() => setPrinting(null), 500);
      }, 120);
    });
  };

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
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button onClick={() => setDetail(r)} className="text-forest text-xs font-semibold hover:underline mr-3">View</button>
                    <button onClick={() => startPrint(r)} className="inline-flex items-center gap-1 text-xs font-semibold bg-forest text-primary-foreground px-2.5 py-1 rounded-md hover:bg-forest-deep">
                      <Download className="w-3 h-3" /> Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <PayslipDetailSheet
          run={detail}
          employeeName={employee?.full_name || ""}
          employeeId={employee?.employee_id}
          jobTitle={employee?.job_title}
          onClose={() => setDetail(null)}
          onDownload={() => { setDetail(null); startPrint(detail); }}
        />
      )}

      {printing && (
        <PayslipPrint
          run={printing}
          employeeName={employee?.full_name || ""}
          employeeId={employee?.employee_id}
          jobTitle={employee?.job_title}
        />
      )}
    </div>
  );
}

function PayslipDetailSheet({
  run, employeeName, employeeId, jobTitle, onClose, onDownload,
}: {
  run: HRPayrollRun;
  employeeName: string;
  employeeId?: string | null;
  jobTitle?: string | null;
  onClose: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="flex-1 bg-foreground/40 print:hidden" onClick={onClose} />
      <aside className="w-full max-w-[620px] h-full bg-background border-l border-border overflow-y-auto print:max-w-full print:border-0">
        <header className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3 flex items-center justify-between print:hidden">
          <div>
            <h2 className="font-bold text-sm">Payslip — {MONTHS[run.pay_month - 1]} {run.pay_year}</h2>
            <p className="text-[10px] text-text-light">{employeeName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onDownload} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-forest text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-forest-deep"><Download className="w-3.5 h-3.5" /> Download PDF</button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-xs font-semibold border border-input px-3 py-1.5 rounded-lg hover:bg-muted" aria-label="Print"><Printer className="w-3.5 h-3.5" /> Print</button>
            <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"><X className="w-4 h-4" /></button>
          </div>
        </header>
        <section className="p-2 sm:p-5">
          <PayslipPrint run={run} employeeName={employeeName} employeeId={employeeId} jobTitle={jobTitle} />
        </section>
      </aside>
    </div>
  );
}

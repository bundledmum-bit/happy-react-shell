import { Link } from "react-router-dom";
import { CalendarCheck, Wallet, User as UserIcon, MailWarning } from "lucide-react";
import { useMyEmployee, useMyLeaveBalances, useMyPayrollRuns, fmtN, MONTHS, STATUS_COLORS } from "@/hooks/useHR";

export default function EmployeePortalDashboard() {
  const { data: employee, isLoading } = useMyEmployee();
  const year = new Date().getFullYear();
  const { data: balances } = useMyLeaveBalances(employee?.id || null, year);
  const { data: payruns } = useMyPayrollRuns(employee?.id || null);
  const latest = (payruns || [])[0];

  if (isLoading) {
    return <div className="text-center py-10 text-sm text-text-light">Loading your profile…</div>;
  }
  if (!employee) {
    return (
      <div className="bg-card border border-border rounded-card p-6 text-center">
        <MailWarning className="w-6 h-6 mx-auto text-amber-600 mb-2" />
        <h2 className="pf text-lg mb-1">Account not yet linked</h2>
        <p className="text-sm text-text-med">Your account is not yet linked to an employee profile. Please contact HR.</p>
      </div>
    );
  }

  const firstName = employee.full_name.split(" ")[0];
  const annual  = (balances || []).find(b => /annual/i.test(b.hr_leave_types?.name || ""));
  const sick    = (balances || []).find(b => /sick/i.test(b.hr_leave_types?.name || ""));
  const remain = (b?: typeof annual) =>
    b ? (Number(b.entitled_days) - Number(b.used_days) - Number(b.pending_days)).toFixed(1) : "—";

  return (
    <div className="space-y-4">
      <section className="bg-card border border-border rounded-card p-4">
        <h1 className="pf text-xl font-bold">Hi {firstName}!</h1>
        <p className="text-sm text-text-med mt-0.5">
          {employee.job_title}
          {employee.hr_departments?.name ? <> · <span className="text-text-light">{employee.hr_departments.name}</span></> : null}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Card icon={<CalendarCheck className="w-4 h-4" />} label="Annual leave left">
          <div className="text-lg font-bold text-forest">{remain(annual)} days</div>
          {annual && <div className="text-[10px] text-text-light">of {Number(annual.entitled_days).toFixed(0)} entitled</div>}
        </Card>
        <Card icon={<CalendarCheck className="w-4 h-4" />} label="Sick leave left">
          <div className="text-lg font-bold text-forest">{remain(sick)} days</div>
          {sick && <div className="text-[10px] text-text-light">of {Number(sick.entitled_days).toFixed(0)} entitled</div>}
        </Card>
      </div>

      <section className="bg-card border border-border rounded-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm flex items-center gap-1.5"><Wallet className="w-4 h-4" /> Latest payslip</h2>
          <Link to="/employee-portal/payslips" className="text-xs text-forest font-semibold hover:underline">View all →</Link>
        </div>
        {latest ? (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <div className="font-semibold text-sm">{MONTHS[latest.pay_month - 1]} {latest.pay_year}</div>
              <div className="text-[10px] text-text-light">Gross {fmtN(latest.gross_salary)} · Net {fmtN(latest.net_salary)}</div>
            </div>
            <span className={`text-[10px] font-semibold capitalize px-2 py-0.5 rounded-pill ${STATUS_COLORS[latest.status] || "bg-muted text-text-med"}`}>{latest.status}</span>
          </div>
        ) : (
          <p className="text-xs text-text-light">No payslips yet.</p>
        )}
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <QuickLink to="/employee-portal/leave" icon={<CalendarCheck className="w-4 h-4" />} label="Apply for Leave" />
        <QuickLink to="/employee-portal/payslips" icon={<Wallet className="w-4 h-4" />} label="View Payslips" />
        <QuickLink to="/employee-portal/profile" icon={<UserIcon className="w-4 h-4" />} label="My Profile" />
      </section>
    </div>
  );
}

function Card({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-card p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-text-light">{icon} {label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="bg-card border border-border rounded-card p-3 flex items-center gap-2 hover:border-forest/40">
      {icon}
      <span className="text-sm font-semibold">{label}</span>
    </Link>
  );
}

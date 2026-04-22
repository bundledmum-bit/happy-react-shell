import { NavLink, Outlet } from "react-router-dom";
import { Users as UsersIcon, Wallet, CalendarCheck, Files, Building2, LayoutDashboard } from "lucide-react";

const TABS = [
  { to: "/admin/hr",             label: "Dashboard",   icon: LayoutDashboard, end: true },
  { to: "/admin/hr/employees",   label: "Employees",   icon: UsersIcon },
  { to: "/admin/hr/payroll",     label: "Payroll",     icon: Wallet },
  { to: "/admin/hr/leave",       label: "Leave",       icon: CalendarCheck },
  { to: "/admin/hr/documents",   label: "Documents",   icon: Files },
  { to: "/admin/hr/departments", label: "Departments", icon: Building2 },
];

export default function AdminHRLayout() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-forest flex items-center gap-2">
          <UsersIcon className="w-6 h-6" /> HR
        </h1>
        <p className="text-xs text-text-light mt-1">
          Manage employees, payroll, leave requests, and HR documents.
        </p>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map(t => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                isActive ? "border-forest text-forest" : "border-transparent text-text-med hover:text-forest"
              }`
            }
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}

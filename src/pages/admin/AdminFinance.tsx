import { useMemo, useState } from "react";
import { NavLink, Routes, Route, useNavigate } from "react-router-dom";
import {
  BarChart3, FileText, Wallet, ShoppingCart, Users, Scale, Briefcase, Settings as SettingsIcon,
  Plus, Trash2, Save, Printer, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Calendar,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import {
  useFinancePL, useFinanceExpenses, useFinanceCogs, useFinancePayroll,
  useFinanceTaxPosition, useFinanceCategories, useFinanceTaxSettings, useFinanceAssets,
  useFinanceProducts, useAddExpense, useUpdateExpense, useDeleteExpense,
  useAddCogs, useDeleteCogs, useAddPayroll, useDeletePayroll,
  useUpdateTaxSettings, useAddAsset, useDeleteAsset,
  computeAnnualPaye, toKobo, fromKobo, fmtNaira, fmtPct, fmtDate, bookValue,
  type Expense, type CogsEntry, type PayrollEntry, type TaxSettings, type FinanceAsset, type PayeBand, type PLRow,
  NTA_2025_PAYE_BANDS,
} from "@/hooks/useFinance";

// ---------- Shared styles ----------
const inputCls = "w-full border border-input rounded-lg px-3 py-2 text-sm bg-background";
const labelCls = "text-[10px] uppercase tracking-widest font-semibold text-text-med block mb-1";
const sectionCls = "text-xs uppercase tracking-widest font-bold text-text-med mt-4 mb-2";
const btnPrimary = "inline-flex items-center gap-1.5 bg-forest text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-forest-deep disabled:opacity-40";
const btnGhost = "inline-flex items-center gap-1.5 text-text-med hover:text-forest text-xs font-semibold";
const cardCls = "bg-card border border-border rounded-xl p-4";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const TYPE_COLORS: Record<string, string> = {
  fixed: "#3B82F6",
  variable: "#F59E0B",
  cogs: "#10B981",
  payroll: "#8B5CF6",
  tax: "#EF4444",
  depreciation: "#6B7280",
};

const TYPE_BG: Record<string, string> = {
  fixed: "bg-blue-50",
  variable: "bg-amber-50",
  cogs: "bg-emerald-50",
  payroll: "bg-purple-50",
  tax: "bg-red-50",
  depreciation: "bg-gray-50",
};

// ---------- Top-level component ----------

const SUBNAV = [
  { to: "/admin/finance", label: "Dashboard", icon: BarChart3, exact: true },
  { to: "/admin/finance/pl", label: "P&L", icon: FileText },
  { to: "/admin/finance/expenses", label: "Expenses", icon: Wallet },
  { to: "/admin/finance/cogs", label: "COGS", icon: ShoppingCart },
  { to: "/admin/finance/payroll", label: "Payroll", icon: Users },
  { to: "/admin/finance/tax", label: "Tax Position", icon: Scale },
  { to: "/admin/finance/assets", label: "Assets", icon: Briefcase },
  { to: "/admin/finance/settings", label: "Settings", icon: SettingsIcon },
];

export default function AdminFinance() {
  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-forest">Finance & Accounting</h1>
          <p className="text-xs text-text-light mt-1">
            All amounts stored as kobo. Displayed as ₦ (Naira). Negative values shown in (brackets).
          </p>
        </div>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-border">
        {SUBNAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                isActive
                  ? "border-forest text-forest"
                  : "border-transparent text-text-med hover:text-forest"
              }`
            }
          >
            <item.icon className="w-3.5 h-3.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Routes>
        <Route index element={<DashboardTab />} />
        <Route path="pl" element={<PLTab />} />
        <Route path="expenses" element={<ExpensesTab />} />
        <Route path="cogs" element={<CogsTab />} />
        <Route path="payroll" element={<PayrollTab />} />
        <Route path="tax" element={<TaxTab />} />
        <Route path="assets" element={<AssetsTab />} />
        <Route path="settings" element={<SettingsTab />} />
      </Routes>
    </div>
  );
}

// ---------- Period selector helper ----------
type PeriodMode = "this_month" | "last_month" | "ytd" | "custom";

function usePeriod(defaultMode: PeriodMode = "this_month") {
  const now = new Date();
  const [mode, setMode] = useState<PeriodMode>(defaultMode);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [month, setMonth] = useState<number>(now.getMonth() + 1);

  const resolved = useMemo(() => {
    const n = new Date();
    if (mode === "this_month") return { year: n.getFullYear(), month: n.getMonth() + 1 };
    if (mode === "last_month") {
      const y = n.getMonth() === 0 ? n.getFullYear() - 1 : n.getFullYear();
      const m = n.getMonth() === 0 ? 12 : n.getMonth();
      return { year: y, month: m };
    }
    if (mode === "ytd") return { year: n.getFullYear(), month: undefined as number | undefined };
    return { year, month };
  }, [mode, year, month]);

  return { mode, setMode, year, setYear, month, setMonth, resolved };
}

function PeriodSelector({ p }: { p: ReturnType<typeof usePeriod> }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {(["this_month","last_month","ytd","custom"] as const).map(m => (
        <button
          key={m}
          onClick={() => p.setMode(m)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            p.mode === m
              ? "bg-forest text-primary-foreground border-forest"
              : "border-border text-text-med hover:bg-muted"
          }`}
        >
          {m === "this_month" ? "This Month" : m === "last_month" ? "Last Month" : m === "ytd" ? "YTD" : "Custom"}
        </button>
      ))}
      {p.mode === "custom" && (
        <>
          <select value={p.month} onChange={e => p.setMonth(Number(e.target.value))}
            className="border border-border rounded-lg px-2 py-1.5 text-xs bg-background">
            {MONTHS.map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
          </select>
          <input type="number" value={p.year} onChange={e => p.setYear(Number(e.target.value))}
            className="w-20 border border-border rounded-lg px-2 py-1.5 text-xs bg-background" />
        </>
      )}
    </div>
  );
}

// ---------- Helpers ----------
function sumKobo<T>(rows: T[] | undefined, key: keyof T): number {
  return (rows || []).reduce((s, r) => s + (Number((r as any)[key]) || 0), 0);
}
function klast<T>(rows: T[] | undefined): T | undefined {
  if (!rows || !rows.length) return undefined;
  return rows[rows.length - 1];
}
function pctChange(curr: number, prev: number): number | null {
  if (!prev) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}
function ngnToKoboNum(ngnLike: number): number {
  return Math.round((ngnLike || 0) * 100);
}

// PL view returns numeric NGN values (not kobo). Convert to kobo for uniformity.
function plRowKobo(row: PLRow | undefined, key: keyof PLRow): number {
  if (!row) return 0;
  return ngnToKoboNum(Number(row[key]) || 0);
}

// ================================================================
// PAGE 1 — DASHBOARD
// ================================================================
function DashboardTab() {
  const p = usePeriod("this_month");
  const { data: plRows } = useFinancePL(p.resolved.year, p.resolved.month);
  const { data: plAll } = useFinancePL(p.resolved.year);
  const { data: expenses } = useFinanceExpenses(p.resolved.year, p.resolved.month);
  const { data: taxPosition } = useFinanceTaxPosition(p.resolved.year);

  const cur = plRows?.[0];
  // Previous period for delta
  const prevMonth = p.resolved.month ? (p.resolved.month === 1 ? 12 : p.resolved.month - 1) : undefined;
  const prevYear = p.resolved.month === 1 ? (p.resolved.year - 1) : p.resolved.year;
  const { data: prevRows } = useFinancePL(prevYear, prevMonth);
  const prev = prevRows?.[0];

  const revCur = plRowKobo(cur, "gross_revenue_ngn");
  const revPrev = plRowKobo(prev, "gross_revenue_ngn");
  const gpCur = plRowKobo(cur, "gross_profit_ngn");
  const ebitdaCur = plRowKobo(cur, "ebitda_ngn");
  const netCur = plRowKobo(cur, "net_profit_ngn");
  const cogsCur = plRowKobo(cur, "cogs_ngn");
  const opexCur = plRowKobo(cur, "total_opex_ngn");
  const payrollCur = plRowKobo(cur, "payroll_cost_ngn");

  // Expense breakdown
  const byType = useMemo(() => {
    const m: Record<string, number> = {};
    (expenses || []).forEach(e => {
      const t = e.category?.type || "other";
      m[t] = (m[t] || 0) + (e.amount || 0);
    });
    return Object.entries(m).map(([type, value]) => ({ type, value }));
  }, [expenses]);

  // Trend chart data (monthly across current year)
  const trend = useMemo(() => {
    return (plAll || []).map(r => ({
      label: `${MONTHS[(r.month || 1) - 1]}`,
      revenue: Number(r.gross_revenue_ngn) || 0,
      cogs: Number(r.cogs_ngn) || 0,
      gp: Number(r.gross_profit_ngn) || 0,
      margin: Number(r.gross_margin_pct) || 0,
    }));
  }, [plAll]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PeriodSelector p={p} />
        <span className="text-[10px] text-text-light">Live — refreshes every 30s</span>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Gross Revenue" value={fmtNaira(revCur)} delta={pctChange(revCur, revPrev)} />
        <KpiCard title="Gross Profit" value={fmtNaira(gpCur)} badge={fmtPct(Number(cur?.gross_margin_pct))} />
        <KpiCard title="EBITDA" value={fmtNaira(ebitdaCur)} badge={fmtPct(Number(cur?.ebitda_margin_pct))} />
        <KpiCard title="Net Profit" value={fmtNaira(netCur, { brackets: true })} badge={fmtPct(Number(cur?.net_margin_pct))} negative={netCur < 0} />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard title="Total Orders" value={String(cur?.order_count ?? 0)} subtitle={`AOV: ${fmtNaira(ngnToKoboNum(Number(cur?.avg_order_value_ngn) || 0))}`} />
        <KpiCard title="Total COGS" value={fmtNaira(cogsCur)} subtitle={revCur > 0 ? `${((cogsCur / revCur) * 100).toFixed(1)}% of revenue` : "—"} />
        <KpiCard title="Total OpEx" value={fmtNaira(opexCur + payrollCur)} subtitle={`Payroll: ${fmtNaira(payrollCur)}`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className={cardCls}>
          <h3 className="font-semibold text-sm mb-3">Revenue vs COGS vs Gross Profit</h3>
          {trend.length === 0 ? (
            <div className="text-xs text-text-light py-10 text-center">No monthly data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `₦${v.toLocaleString()}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="revenue" stroke="#2D6A4F" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cogs" stroke="#F59E0B" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="gp" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={cardCls}>
          <h3 className="font-semibold text-sm mb-3">Expense Breakdown</h3>
          {byType.length === 0 ? (
            <div className="text-xs text-text-light py-10 text-center">No expenses logged</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byType} dataKey="value" nameKey="type" cx="50%" cy="50%" innerRadius={50} outerRadius={90} label={(d: any) => d.type}>
                  {byType.map((b, i) => <Cell key={i} fill={TYPE_COLORS[b.type] || "#6B7280"} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmtNaira(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={cardCls}>
          <h3 className="font-semibold text-sm mb-3">Gross Margin % by Month</h3>
          {trend.length === 0 ? (
            <div className="text-xs text-text-light py-10 text-center">No monthly data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
                <Bar dataKey="margin" fill="#2D6A4F" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={cardCls}>
          <h3 className="font-semibold text-sm mb-3">Revenue by Channel</h3>
          <div className="py-10 text-center">
            <div className="text-2xl font-bold text-forest">{fmtNaira(revCur)}</div>
            <div className="text-xs text-text-light mt-1">Direct Sales (100%)</div>
            <div className="text-[10px] text-text-light mt-2">Multi-channel breakdown coming soon</div>
          </div>
        </div>
      </div>

      {/* Tax alert */}
      <TaxAlertBox position={taxPosition} />
    </div>
  );
}

function KpiCard({ title, value, delta, badge, subtitle, negative }: {
  title: string; value: string; delta?: number | null; badge?: string; subtitle?: string; negative?: boolean;
}) {
  return (
    <div className={cardCls}>
      <div className="text-[10px] uppercase tracking-widest font-semibold text-text-light">{title}</div>
      <div className={`text-xl font-bold mt-1 ${negative ? "text-red-600" : "text-forest"}`}>{value}</div>
      <div className="flex items-center gap-2 mt-1">
        {delta != null && (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${delta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {delta >= 0 ? "+" : ""}{delta.toFixed(1)}% vs last period
          </span>
        )}
        {badge && (
          <span className="inline-flex items-center text-[10px] font-semibold text-forest bg-forest/10 px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
        {subtitle && <span className="text-[10px] text-text-light">{subtitle}</span>}
      </div>
    </div>
  );
}

function TaxAlertBox({ position }: { position?: Record<string, any> }) {
  if (!position) return null;
  const small = position.company_size === "small" || position.is_small_company;
  const vatReg = !!position.vat_registered;
  const revenueYtd = Number(position.revenue_ytd || position.annual_revenue_ytd || 0);
  const vatThreshold = 25_000_000; // ₦25M
  const approachingVat = !vatReg && revenueYtd >= vatThreshold * 0.8;

  return (
    <div className="space-y-2">
      <div className={`border rounded-xl p-4 flex items-start gap-3 ${small ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
        {small ? <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />}
        <div className="flex-1">
          <div className="font-semibold text-sm">
            {small ? "CIT Exempt — Small Company" : "Large Company — CIT 25% applies"}
          </div>
          <div className="text-xs text-text-med mt-0.5">
            Annual turnover: ₦{Number(revenueYtd).toLocaleString()} (threshold ₦100M)
          </div>
        </div>
      </div>

      <div className={`border rounded-xl p-4 flex items-start gap-3 ${approachingVat ? "bg-amber-50 border-amber-200" : vatReg ? "bg-blue-50 border-blue-200" : "bg-muted border-border"}`}>
        {approachingVat ? <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />}
        <div className="flex-1">
          <div className="font-semibold text-sm">
            VAT status: {vatReg ? "Registered" : "Not registered"}
          </div>
          {approachingVat && (
            <div className="text-xs text-amber-700 mt-0.5">
              ⚠️ Approaching ₦25M VAT threshold — register with FIRS before you cross it.
            </div>
          )}
        </div>
      </div>

      <div className="border border-border rounded-xl p-4">
        <div className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Upcoming Remittance Deadlines</div>
        <ul className="text-xs text-text-med space-y-1">
          <li>• <b>PAYE</b> — by 10th of following month (State IRS)</li>
          <li>• <b>Pension</b> — within 7 days of payroll run (PenCom via PFA)</li>
          <li>• <b>NSITF</b> — by 16th of following month</li>
          <li>• <b>VAT</b> — by 21st of following month (if registered)</li>
        </ul>
      </div>
    </div>
  );
}

// ================================================================
// PAGE 2 — P&L STATEMENT
// ================================================================
function PLTab() {
  const [gran, setGran] = useState<"month" | "quarter" | "year">("month");
  const [compare, setCompare] = useState(false);
  const p = usePeriod("this_month");
  const { data: plRows } = useFinancePL(p.resolved.year, p.resolved.month);
  const { data: expensesPeriod } = useFinanceExpenses(p.resolved.year, p.resolved.month);
  const { data: catList } = useFinanceCategories();

  // Previous
  const prevMonth = p.resolved.month ? (p.resolved.month === 1 ? 12 : p.resolved.month - 1) : undefined;
  const prevYear = p.resolved.month === 1 ? (p.resolved.year - 1) : p.resolved.year;
  const { data: prevRows } = useFinancePL(prevYear, prevMonth);

  const cur = plRows?.[0];
  const prev = prevRows?.[0];

  // Group expenses by category name for OpEx detail
  const opexByCat = useMemo(() => {
    const m: Record<string, { name: string; amount: number; type: string }> = {};
    (expensesPeriod || []).forEach(e => {
      const name = e.category?.name || "Uncategorised";
      const t = e.category?.type || "variable";
      if (t === "cogs" || t === "tax" || t === "payroll" || t === "depreciation") return;
      if (!m[name]) m[name] = { name, amount: 0, type: t };
      m[name].amount += e.amount || 0;
    });
    return Object.values(m).sort((a, b) => b.amount - a.amount);
  }, [expensesPeriod]);

  const print = () => window.print();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <PeriodSelector p={p} />
          <div className="flex gap-1 ml-2">
            {(["month","quarter","year"] as const).map(g => (
              <button key={g} onClick={() => setGran(g)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${gran===g ? "bg-forest text-primary-foreground border-forest" : "border-border text-text-med"}`}>
                {g[0].toUpperCase()+g.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs">
            <input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)} />
            Compare previous
          </label>
          <button onClick={print} className={btnPrimary}>
            <Printer className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      <div className={cardCls + " print:shadow-none"}>
        <div className="text-center border-b border-border pb-3 mb-3">
          <div className="text-[10px] uppercase tracking-[3px] text-text-light">Income Statement</div>
          <div className="text-lg font-bold text-forest">Bundledmum</div>
          <div className="text-xs text-text-med">Period: {MONTHS[(cur?.month ?? p.resolved.month ?? 1) - 1]} {cur?.year ?? p.resolved.year}</div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: compare ? "1fr 140px 140px" : "1fr 160px" }}>
          <PLHeader compare={compare} />

          <PLSection title="REVENUE" />
          <PLLine label="Product Sales" v={plRowKobo(cur, "product_revenue_ngn")} p={plRowKobo(prev, "product_revenue_ngn")} compare={compare} />
          <PLLine label="Delivery Revenue" v={plRowKobo(cur, "delivery_revenue_ngn")} p={plRowKobo(prev, "delivery_revenue_ngn")} compare={compare} />
          <PLLine label="Service & Packaging Fees" v={plRowKobo(cur, "service_fee_revenue_ngn")} p={plRowKobo(prev, "service_fee_revenue_ngn")} compare={compare} />
          <PLTotal label="TOTAL REVENUE" v={plRowKobo(cur, "gross_revenue_ngn")} p={plRowKobo(prev, "gross_revenue_ngn")} compare={compare} />

          <PLSection title="COST OF GOODS SOLD" />
          <PLLine label="Product Procurement, Packaging & Inbound" v={plRowKobo(cur, "cogs_ngn")} p={plRowKobo(prev, "cogs_ngn")} compare={compare} />
          <PLTotal label="TOTAL COGS" v={plRowKobo(cur, "cogs_ngn")} p={plRowKobo(prev, "cogs_ngn")} compare={compare} />
          <PLTotal label="GROSS PROFIT" v={plRowKobo(cur, "gross_profit_ngn")} p={plRowKobo(prev, "gross_profit_ngn")} compare={compare} badge={fmtPct(Number(cur?.gross_margin_pct))} />

          <PLSection title="OPERATING EXPENSES" />
          <PLLine label="Salaries & Wages" v={plRowKobo(cur, "payroll_cost_ngn")} p={plRowKobo(prev, "payroll_cost_ngn")} compare={compare} />
          {opexByCat.map(c => (
            <PLLine key={c.name} label={c.name} v={c.amount} p={0} compare={compare} />
          ))}
          <PLTotal label="TOTAL OPEX" v={plRowKobo(cur, "total_opex_ngn") + plRowKobo(cur, "payroll_cost_ngn")} p={plRowKobo(prev, "total_opex_ngn") + plRowKobo(prev, "payroll_cost_ngn")} compare={compare} />

          <PLTotal label="EBITDA" v={plRowKobo(cur, "ebitda_ngn")} p={plRowKobo(prev, "ebitda_ngn")} compare={compare} badge={fmtPct(Number(cur?.ebitda_margin_pct))} />

          <PLLine label="Depreciation & Amortisation" v={plRowKobo(cur, "depreciation_ngn")} p={plRowKobo(prev, "depreciation_ngn")} compare={compare} />
          <PLTotal label="EBIT (Operating Profit)" v={plRowKobo(cur, "ebit_ngn")} p={plRowKobo(prev, "ebit_ngn")} compare={compare} />

          <PLLine label="Tax Expenses" v={plRowKobo(cur, "tax_expenses_ngn")} p={plRowKobo(prev, "tax_expenses_ngn")} compare={compare} />
          <PLTotal label="NET PROFIT / (LOSS)" v={plRowKobo(cur, "net_profit_ngn")} p={plRowKobo(prev, "net_profit_ngn")} compare={compare} badge={fmtPct(Number(cur?.net_margin_pct))} highlight />
        </div>

        {!cur && (
          <div className="text-center text-xs text-text-light py-6">
            No data for this period. Enter expenses, COGS, and payroll to populate the statement.
          </div>
        )}
      </div>
    </div>
  );
}

function PLHeader({ compare }: { compare: boolean }) {
  return (
    <>
      <div className="text-[10px] uppercase tracking-widest text-text-light font-semibold border-b border-border pb-1"></div>
      <div className="text-[10px] uppercase tracking-widest text-text-light font-semibold border-b border-border pb-1 text-right">Current</div>
      {compare && <div className="text-[10px] uppercase tracking-widest text-text-light font-semibold border-b border-border pb-1 text-right">Previous</div>}
    </>
  );
}

function PLSection({ title }: { title: string }) {
  return (
    <div className="col-span-3 text-[10px] uppercase tracking-widest font-bold text-forest mt-3 mb-0.5">{title}</div>
  );
}

function PLLine({ label, v, p, compare }: { label: string; v: number; p: number; compare: boolean }) {
  return (
    <>
      <div className="text-sm text-text-med py-1 pl-3">{label}</div>
      <div className={`text-sm text-right py-1 tabular-nums ${v < 0 ? "text-red-600" : ""}`}>{fmtNaira(v, { brackets: true })}</div>
      {compare && <div className={`text-sm text-right py-1 tabular-nums text-text-light ${p < 0 ? "text-red-600" : ""}`}>{fmtNaira(p, { brackets: true })}</div>}
    </>
  );
}

function PLTotal({ label, v, p, compare, badge, highlight }: { label: string; v: number; p: number; compare: boolean; badge?: string; highlight?: boolean }) {
  return (
    <>
      <div className={`text-sm font-bold py-1.5 border-t border-border ${highlight ? "text-forest" : ""}`}>
        {label} {badge && <span className="ml-2 text-[10px] font-semibold text-forest bg-forest/10 px-1.5 py-0.5 rounded">{badge}</span>}
      </div>
      <div className={`text-sm font-bold text-right py-1.5 border-t border-border tabular-nums ${v < 0 ? "text-red-600" : ""} ${highlight ? "text-forest" : ""}`}>{fmtNaira(v, { brackets: true })}</div>
      {compare && <div className={`text-sm font-bold text-right py-1.5 border-t border-border tabular-nums text-text-light ${p < 0 ? "text-red-600" : ""}`}>{fmtNaira(p, { brackets: true })}</div>}
    </>
  );
}

// ================================================================
// PAGE 3 — EXPENSES
// ================================================================
function ExpensesTab() {
  const p = usePeriod("this_month");
  const [filterType, setFilterType] = useState<string>("");
  const [filterCat, setFilterCat] = useState<string>("");

  const { data: categories } = useFinanceCategories();
  const { data: expenses } = useFinanceExpenses(p.resolved.year, p.resolved.month);
  const addE = useAddExpense();
  const updE = useUpdateExpense();
  const delE = useDeleteExpense();

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<any>({
    expense_date: today, category_id: "", description: "", amount: "",
    vendor: "", is_recurring: false, recurrence: "monthly", notes: "",
  });

  const filtered = useMemo(() => {
    return (expenses || []).filter(e => {
      if (filterType && e.category?.type !== filterType) return false;
      if (filterCat && e.category_id !== filterCat) return false;
      return true;
    });
  }, [expenses, filterType, filterCat]);

  const typeSummary = useMemo(() => {
    const m: Record<string, number> = { fixed: 0, variable: 0, payroll: 0, tax: 0, cogs: 0, depreciation: 0 };
    (expenses || []).forEach(e => {
      const t = e.category?.type || "variable";
      m[t] = (m[t] || 0) + (e.amount || 0);
    });
    return m;
  }, [expenses]);

  const canSave = form.expense_date && form.category_id && form.description.trim() && Number(form.amount) > 0;

  const handleSave = () => {
    addE.mutate({
      expense_date: form.expense_date,
      category_id: form.category_id,
      description: form.description.trim(),
      amount: toKobo(Number(form.amount)),
      vendor: form.vendor?.trim() || null,
      is_recurring: !!form.is_recurring,
      recurrence: form.is_recurring ? form.recurrence : null,
      notes: form.notes?.trim() || null,
    }, {
      onSuccess: () => setForm({ ...form, description: "", amount: "", vendor: "", notes: "" }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PeriodSelector p={p} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {(["fixed","variable","payroll","tax","cogs"] as const).map(t => (
          <div key={t} className={`rounded-xl border border-border p-3 ${TYPE_BG[t]}`}>
            <div className="text-[10px] uppercase tracking-widest font-semibold text-text-med">{t}</div>
            <div className="text-lg font-bold" style={{ color: TYPE_COLORS[t] }}>{fmtNaira(typeSummary[t] || 0)}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={cardCls}>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><Plus className="w-4 h-4" /> Log an expense</h3>
          <div className="space-y-2">
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className={inputCls}>
                <option value="">Select category…</option>
                {Object.entries(groupBy(categories || [], "type")).map(([type, cats]) => (
                  <optgroup key={type} label={type.toUpperCase()}>
                    {(cats as any[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Amount (₦)</label>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={inputCls} placeholder="e.g. 50000" />
            </div>
            <div>
              <label className={labelCls}>Vendor (optional)</label>
              <input type="text" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} className={inputCls} />
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={form.is_recurring} onChange={e => setForm({ ...form, is_recurring: e.target.checked })} />
              Is Recurring
            </label>
            {form.is_recurring && (
              <div>
                <label className={labelCls}>Recurrence</label>
                <select value={form.recurrence} onChange={e => setForm({ ...form, recurrence: e.target.value })} className={inputCls}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
            )}
            <div>
              <label className={labelCls}>Notes (optional)</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls} rows={2} />
            </div>
            <button disabled={!canSave || addE.isPending} onClick={handleSave} className={btnPrimary + " w-full justify-center"}>
              <Save className="w-4 h-4" /> {addE.isPending ? "Saving…" : "Save expense"}
            </button>
          </div>
        </div>

        <div className={cardCls + " lg:col-span-2"}>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h3 className="font-semibold text-sm mr-auto">Expense list ({filtered.length})</h3>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border border-border rounded-lg px-2 py-1 text-xs">
              <option value="">All types</option>
              {["fixed","variable","payroll","tax","cogs","depreciation"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border border-border rounded-lg px-2 py-1 text-xs">
              <option value="">All categories</option>
              {(categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 pr-2">Category</th>
                  <th className="py-2 pr-2">Description</th>
                  <th className="py-2 pr-2">Vendor</th>
                  <th className="py-2 pr-2 text-right">Amount</th>
                  <th className="py-2 pr-2">Recurring</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-6 text-text-light">No expenses this period</td></tr>
                )}
                {filtered.map(e => {
                  const t = e.category?.type || "";
                  return (
                    <tr key={e.id} className={`border-b border-border hover:bg-muted/30 ${t ? TYPE_BG[t] || "" : ""}`}>
                      <td className="py-1.5 pr-2">{fmtDate(e.expense_date)}</td>
                      <td className="py-1.5 pr-2">{e.category?.name || "—"}</td>
                      <td className="py-1.5 pr-2">{e.description}</td>
                      <td className="py-1.5 pr-2">{e.vendor || "—"}</td>
                      <td className="py-1.5 pr-2 text-right tabular-nums font-semibold">{fmtNaira(e.amount)}</td>
                      <td className="py-1.5 pr-2">{e.is_recurring ? e.recurrence : ""}</td>
                      <td className="py-1.5 text-right">
                        <button onClick={() => { if (confirm("Delete this expense?")) delE.mutate(e.id); }}
                          className="text-red-600 hover:text-red-800"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-bold border-t-2 border-border">
                  <td colSpan={4} className="py-2 pr-2">Total</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{fmtNaira(sumKobo(filtered, "amount"))}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((m: Record<string, T[]>, item) => {
    const k = String(item[key]);
    (m[k] = m[k] || []).push(item);
    return m;
  }, {});
}

// ================================================================
// PAGE 4 — COGS
// ================================================================
function CogsTab() {
  const p = usePeriod("this_month");
  const { data: cogs } = useFinanceCogs(p.resolved.year, p.resolved.month);
  const { data: products } = useFinanceProducts();
  const { data: plRow } = useFinancePL(p.resolved.year, p.resolved.month);
  const addC = useAddCogs();
  const delC = useDeleteCogs();

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<any>({
    product_id: "", product_name: "", supplier: "", unit_cost: "", quantity: "1",
    purchase_date: today, notes: "",
  });

  const total = Number(form.unit_cost || 0) * Number(form.quantity || 0);
  const canSave = form.product_name.trim() && Number(form.unit_cost) > 0 && Number(form.quantity) > 0 && form.purchase_date;

  const revCur = plRowKobo(plRow?.[0], "gross_revenue_ngn");
  const cogsCur = sumKobo(cogs, "total_cost");
  const gp = revCur - cogsCur;
  const margin = revCur > 0 ? (gp / revCur) * 100 : 0;

  // Group by product
  const byProduct = useMemo(() => {
    const m: Record<string, { name: string; total: number; qty: number }> = {};
    (cogs || []).forEach(c => {
      const n = c.product_name;
      if (!m[n]) m[n] = { name: n, total: 0, qty: 0 };
      m[n].total += c.total_cost || 0;
      m[n].qty += c.quantity || 0;
    });
    return Object.values(m).sort((a, b) => b.total - a.total);
  }, [cogs]);

  const handleSave = () => {
    const p = (products || []).find(x => x.id === form.product_id);
    addC.mutate({
      product_id: form.product_id || null,
      product_name: p?.name || form.product_name.trim(),
      supplier: form.supplier?.trim() || null,
      unit_cost: toKobo(Number(form.unit_cost)),
      quantity: Number(form.quantity),
      purchase_date: form.purchase_date,
      notes: form.notes?.trim() || null,
    }, {
      onSuccess: () => setForm({ ...form, product_id: "", product_name: "", supplier: "", unit_cost: "", quantity: "1", notes: "" }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PeriodSelector p={p} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KpiCard title="Revenue" value={fmtNaira(revCur)} />
        <KpiCard title="COGS" value={fmtNaira(cogsCur)} subtitle={revCur > 0 ? `${((cogsCur/revCur)*100).toFixed(1)}% of revenue` : "—"} />
        <KpiCard title="Gross Margin" value={fmtPct(margin)} badge={fmtNaira(gp)} negative={gp < 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={cardCls}>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><Plus className="w-4 h-4" /> Record product cost</h3>
          <div className="space-y-2">
            <div>
              <label className={labelCls}>Product</label>
              <select value={form.product_id}
                onChange={e => {
                  const pid = e.target.value;
                  const match = (products || []).find(x => x.id === pid);
                  setForm({ ...form, product_id: pid, product_name: match?.name || "" });
                }}
                className={inputCls}>
                <option value="">— Custom (type name) —</option>
                {(products || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {!form.product_id && (
              <div>
                <label className={labelCls}>Product name</label>
                <input value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} className={inputCls} />
              </div>
            )}
            <div>
              <label className={labelCls}>Supplier</label>
              <input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Unit Cost (₦)</label>
                <input type="number" min="0" step="0.01" value={form.unit_cost} onChange={e => setForm({ ...form, unit_cost: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Quantity</label>
                <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Total (auto)</label>
              <input readOnly value={fmtNaira(toKobo(total))} className={inputCls + " bg-muted"} />
            </div>
            <div>
              <label className={labelCls}>Purchase Date</label>
              <input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className={inputCls} />
            </div>
            <button disabled={!canSave || addC.isPending} onClick={handleSave} className={btnPrimary + " w-full justify-center"}>
              <Save className="w-4 h-4" /> Save COGS entry
            </button>
          </div>
        </div>

        <div className={cardCls + " lg:col-span-2"}>
          <h3 className="font-semibold text-sm mb-3">COGS entries ({cogs?.length || 0})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-2">Date</th>
                  <th className="py-2 pr-2">Product</th>
                  <th className="py-2 pr-2">Supplier</th>
                  <th className="py-2 pr-2 text-right">Unit</th>
                  <th className="py-2 pr-2 text-right">Qty</th>
                  <th className="py-2 pr-2 text-right">Total</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {(cogs || []).length === 0 && (
                  <tr><td colSpan={7} className="text-center py-6 text-text-light">No COGS entries</td></tr>
                )}
                {(cogs || []).map(c => (
                  <tr key={c.id} className="border-b border-border hover:bg-muted/30">
                    <td className="py-1.5 pr-2">{fmtDate(c.purchase_date)}</td>
                    <td className="py-1.5 pr-2">{c.product_name}</td>
                    <td className="py-1.5 pr-2">{c.supplier || "—"}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{fmtNaira(c.unit_cost)}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{c.quantity}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums font-semibold">{fmtNaira(c.total_cost)}</td>
                    <td className="py-1.5 text-right">
                      <button onClick={() => { if (confirm("Delete entry?")) delC.mutate(c.id); }}
                        className="text-red-600 hover:text-red-800"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold border-t-2 border-border">
                  <td colSpan={5} className="py-2 pr-2">Total COGS</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{fmtNaira(cogsCur)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {byProduct.length > 0 && (
            <div className="mt-4">
              <div className={sectionCls}>By product</div>
              <div className="space-y-1">
                {byProduct.map(p => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <span>{p.name} <span className="text-text-light">×{p.qty}</span></span>
                    <span className="tabular-nums font-semibold">{fmtNaira(p.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ================================================================
// PAGE 5 — PAYROLL
// ================================================================
function PayrollTab() {
  const p = usePeriod("this_month");
  const { data: payroll } = useFinancePayroll(p.resolved.year, p.resolved.month);
  const { data: settings } = useFinanceTaxSettings();
  const addP = useAddPayroll();
  const delP = useDeletePayroll();

  const now = new Date();
  const [form, setForm] = useState<any>({
    employee_name: "", role: "",
    pay_month: now.getMonth() + 1, pay_year: now.getFullYear(),
    basic_salary: "", housing_allowance: "", transport_allowance: "", other_allowances: "",
    include_nhf: false, notes: "",
  });

  const bands = settings?.paye_bands || NTA_2025_PAYE_BANDS;
  const empPensionRate = Number(settings?.employee_pension_rate ?? 8);
  const erPensionRate = Number(settings?.employer_pension_rate ?? 10);
  const nhfRate = Number(settings?.nhf_rate ?? 2.5);
  const nsitfRate = Number(settings?.nsitf_rate ?? 1);
  const itfRate = Number(settings?.itf_rate ?? 1);

  // Live calculations — compute everything in KOBO to avoid double-rounding.
  // Inputs arrive as ₦, convert to kobo up front, then all downstream math
  // stays in integer kobo.
  const basicK = toKobo(Number(form.basic_salary) || 0);
  const housingK = toKobo(Number(form.housing_allowance) || 0);
  const transportK = toKobo(Number(form.transport_allowance) || 0);
  const otherK = toKobo(Number(form.other_allowances) || 0);

  // Gross salary (kobo) — basic + housing + transport + other
  const grossK = basicK + housingK + transportK + otherK;
  // Pensionable emoluments (kobo) — basic + housing + transport
  const pensionableK = basicK + housingK + transportK;

  // Employee pension — 8 % of pensionable
  const empPensionK = Math.round(pensionableK * (empPensionRate / 100));
  // NHF — 2.5 % of basic (only if included)
  const nhfK = form.include_nhf ? Math.round(basicK * (nhfRate / 100)) : 0;

  // PAYE — NTA 2025 progressive bands. Bands are defined in NGN so we
  // compute annual tax in NGN then convert the result to kobo.
  const annualTaxableNgn = Math.max(0, fromKobo(grossK) * 12 - fromKobo(empPensionK + nhfK) * 12);
  const annualPayeNgn = computeAnnualPaye(annualTaxableNgn, bands);
  const monthlyPayeK = Math.round(toKobo(annualPayeNgn) / 12);

  // Totals (all kobo)
  const totalEmpDedK = empPensionK + nhfK + monthlyPayeK;
  const netK = grossK - totalEmpDedK;

  // Employer-side costs
  const erPensionK = Math.round(pensionableK * (erPensionRate / 100)); // 10 % of pensionable
  const nsitfK = Math.round(grossK * (nsitfRate / 100));               // 1 % of gross
  const itfK = Math.round(grossK * (itfRate / 100));                   // 1 % of annual payroll ÷ 12 → gross proxy
  const erCostK = grossK + erPensionK + nsitfK + itfK;

  const canSave = form.employee_name.trim() && basicK > 0;

  const handleSave = () => {
    // NOTE: All fields below are required by the DB — finance_payroll
    // has no generated columns. Every calculated amount is sent as an
    // integer kobo value.
    const payload = {
      employee_name: form.employee_name.trim(),
      role: form.role?.trim() || null,
      pay_month: Number(form.pay_month),
      pay_year: Number(form.pay_year),
      basic_salary: basicK,
      housing_allowance: housingK,
      transport_allowance: transportK,
      other_allowances: otherK,
      gross_salary: grossK,
      employee_pension: empPensionK,
      nhf_deduction: nhfK,
      paye_tax: monthlyPayeK,
      total_employee_deductions: totalEmpDedK,
      net_salary: netK,
      employer_pension: erPensionK,
      nsitf: nsitfK,
      itf: itfK,
      total_employer_cost: erCostK,
      notes: form.notes?.trim() || null,
    };
    addP.mutate(payload, {
      onSuccess: () => setForm({ ...form, employee_name: "", role: "", basic_salary: "", housing_allowance: "", transport_allowance: "", other_allowances: "", notes: "" }),
    });
  };

  // Summaries
  const totals = useMemo(() => {
    const rows = payroll || [];
    return {
      gross: sumKobo(rows, "gross_salary"),
      paye: sumKobo(rows, "paye_tax"),
      empPension: sumKobo(rows, "employee_pension"),
      erPension: sumKobo(rows, "employer_pension"),
      nsitf: sumKobo(rows, "nsitf"),
      itf: sumKobo(rows, "itf"),
      erCost: sumKobo(rows, "total_employer_cost"),
      net: sumKobo(rows, "net_salary"),
    };
  }, [payroll]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PeriodSelector p={p} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={cardCls}>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add payroll entry</h3>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Employee Name</label>
                <input value={form.employee_name} onChange={e => setForm({ ...form, employee_name: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Role</label>
                <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Pay Month</label>
                <select value={form.pay_month} onChange={e => setForm({ ...form, pay_month: Number(e.target.value) })} className={inputCls}>
                  {MONTHS.map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Pay Year</label>
                <input type="number" value={form.pay_year} onChange={e => setForm({ ...form, pay_year: Number(e.target.value) })} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Basic Salary (₦)</label>
                <input type="number" min="0" value={form.basic_salary} onChange={e => setForm({ ...form, basic_salary: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Housing (₦)</label>
                <input type="number" min="0" value={form.housing_allowance} onChange={e => setForm({ ...form, housing_allowance: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Transport (₦)</label>
                <input type="number" min="0" value={form.transport_allowance} onChange={e => setForm({ ...form, transport_allowance: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Other Allow. (₦)</label>
                <input type="number" min="0" value={form.other_allowances} onChange={e => setForm({ ...form, other_allowances: e.target.value })} className={inputCls} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={form.include_nhf} onChange={e => setForm({ ...form, include_nhf: e.target.checked })} />
              Include NHF ({nhfRate}% of basic — optional for private employees)
            </label>
            <button disabled={!canSave || addP.isPending} onClick={handleSave} className={btnPrimary + " w-full justify-center"}>
              <Save className="w-4 h-4" /> Save payslip
            </button>
          </div>
        </div>

        <div className={cardCls}>
          <h3 className="font-semibold text-sm mb-3">Payslip preview</h3>
          <div className="space-y-1 text-sm">
            <Row l="Gross Salary" v={grossK} />
            <Row l="Pensionable Emoluments" v={pensionableK} muted />
            <div className={sectionCls}>Employee deductions</div>
            <Row l={`Employee Pension (${empPensionRate}%)`} v={empPensionK} />
            {form.include_nhf && <Row l={`NHF (${nhfRate}%)`} v={nhfK} />}
            <Row l="PAYE Tax (NTA 2025 bands)" v={monthlyPayeK} />
            <Row l="Total Deductions" v={totalEmpDedK} bold />
            <Row l="Net Salary" v={netK} bold highlight />
            <div className={sectionCls}>Employer cost</div>
            <Row l={`Employer Pension (${erPensionRate}%)`} v={erPensionK} />
            <Row l={`NSITF (${nsitfRate}%)`} v={nsitfK} />
            <Row l={`ITF (${itfRate}%)`} v={itfK} />
            <Row l="Total Employer Cost" v={erCostK} bold highlight />
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <h3 className="font-semibold text-sm mb-3">Payroll entries ({payroll?.length || 0})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="py-2 pr-2">Employee</th>
                <th className="py-2 pr-2">Role</th>
                <th className="py-2 pr-2 text-right">Gross</th>
                <th className="py-2 pr-2 text-right">PAYE</th>
                <th className="py-2 pr-2 text-right">Pension</th>
                <th className="py-2 pr-2 text-right">NSITF</th>
                <th className="py-2 pr-2 text-right">Net</th>
                <th className="py-2 pr-2 text-right">Total Cost</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {(payroll || []).length === 0 && (
                <tr><td colSpan={9} className="text-center py-6 text-text-light">No payroll entries for this period</td></tr>
              )}
              {(payroll || []).map(r => (
                <tr key={r.id} className="border-b border-border hover:bg-muted/30">
                  <td className="py-1.5 pr-2">{r.employee_name}</td>
                  <td className="py-1.5 pr-2">{r.role || "—"}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{fmtNaira(r.gross_salary)}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{fmtNaira(r.paye_tax)}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{fmtNaira(r.employee_pension)}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{fmtNaira(r.nsitf)}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums font-semibold">{fmtNaira(r.net_salary)}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{fmtNaira(r.total_employer_cost)}</td>
                  <td className="py-1.5 text-right">
                    <button onClick={() => { if (confirm("Delete entry?")) delP.mutate(r.id); }}
                      className="text-red-600 hover:text-red-800"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold border-t-2 border-border">
                <td colSpan={2} className="py-2 pr-2">Totals</td>
                <td className="py-2 pr-2 text-right tabular-nums">{fmtNaira(totals.gross)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{fmtNaira(totals.paye)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{fmtNaira(totals.empPension)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{fmtNaira(totals.nsitf)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{fmtNaira(totals.net)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{fmtNaira(totals.erCost)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className={cardCls}>
        <h3 className="font-semibold text-sm mb-3">Remittance Summary (current period)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="border border-border rounded-lg p-3">
            <div className="font-semibold">State IRS (PAYE)</div>
            <div className="text-lg font-bold text-forest tabular-nums">{fmtNaira(totals.paye)}</div>
            <div className="text-[10px] text-text-light">Due by 10th of following month</div>
          </div>
          <div className="border border-border rounded-lg p-3">
            <div className="font-semibold">PenCom (Pension)</div>
            <div className="text-lg font-bold text-forest tabular-nums">{fmtNaira(totals.empPension + totals.erPension)}</div>
            <div className="text-[10px] text-text-light">Within 7 days of payroll run</div>
          </div>
          <div className="border border-border rounded-lg p-3">
            <div className="font-semibold">NSITF</div>
            <div className="text-lg font-bold text-forest tabular-nums">{fmtNaira(totals.nsitf)}</div>
            <div className="text-[10px] text-text-light">Due by 16th of following month</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ l, v, bold, highlight, muted }: { l: string; v: number; bold?: boolean; highlight?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 border-b border-border/50 ${bold ? "font-bold" : ""} ${highlight ? "text-forest" : ""} ${muted ? "text-text-light" : ""}`}>
      <span>{l}</span>
      <span className="tabular-nums">{fmtNaira(v)}</span>
    </div>
  );
}

// ================================================================
// PAGE 6 — TAX POSITION
// ================================================================
function TaxTab() {
  const year = new Date().getFullYear();
  const { data: position } = useFinanceTaxPosition(year);
  const { data: settings } = useFinanceTaxSettings();
  const { data: plAll } = useFinancePL(year);
  const { data: payrollAll } = useFinancePayroll(year);

  const small = position?.company_size === "small" || position?.is_small_company;
  const revenueYtd = Number(position?.revenue_ytd || position?.annual_revenue_ytd || 0);
  const threshold = 100_000_000;
  const revPct = Math.min(100, (revenueYtd / threshold) * 100);
  const assessableProfit = Number(position?.assessable_profit || 0);
  const citRate = Number(settings?.cit_rate ?? 0);
  const devRate = Number(settings?.development_levy_rate ?? 0);
  const citLiability = small ? 0 : assessableProfit * (citRate / 100);
  const devLiability = small ? 0 : assessableProfit * (devRate / 100);

  const vatReg = !!settings?.vat_registered;
  const vatRate = Number(settings?.vat_rate ?? 7.5);
  const totalRevenue = (plAll || []).reduce((s, r) => s + (Number(r.gross_revenue_ngn) || 0), 0);
  const totalCogs = (plAll || []).reduce((s, r) => s + (Number(r.cogs_ngn) || 0), 0);
  const vatOutput = vatReg ? totalRevenue * (vatRate / 100) : 0;
  const vatInput = vatReg ? totalCogs * (vatRate / 100) : 0;
  const vatNet = vatOutput - vatInput;

  // Tax calendar per month
  const calendar = useMemo(() => {
    const rows: Array<{ month: number; label: string; paye: number; pension: number; nsitf: number }> = [];
    for (let m = 1; m <= 12; m++) {
      const entries = (payrollAll || []).filter(p => p.pay_month === m);
      rows.push({
        month: m,
        label: MONTHS[m - 1],
        paye: sumKobo(entries, "paye_tax"),
        pension: sumKobo(entries, "employee_pension") + sumKobo(entries, "employer_pension"),
        nsitf: sumKobo(entries, "nsitf"),
      });
    }
    return rows;
  }, [payrollAll]);

  const totalPaye = calendar.reduce((s, r) => s + r.paye, 0);
  const totalPension = calendar.reduce((s, r) => s + r.pension, 0);
  const totalNsitf = calendar.reduce((s, r) => s + r.nsitf, 0);
  const totalItf = sumKobo(payrollAll, "itf");

  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <h3 className="font-semibold text-sm mb-3">Company Status ({year})</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className={labelCls}>Classification</div>
            <div className={`text-lg font-bold ${small ? "text-emerald-600" : "text-amber-600"}`}>{small ? "Small Company" : "Large Company"}</div>
            <div className="text-[10px] text-text-light">Threshold ₦100M annual turnover</div>
          </div>
          <div>
            <div className={labelCls}>Annual Revenue YTD</div>
            <div className="text-lg font-bold text-forest tabular-nums">₦{Math.round(revenueYtd).toLocaleString()}</div>
            <div className="w-full h-2 rounded-full bg-muted mt-2 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${revPct}%`, background: revPct > 90 ? "#EF4444" : "#2D6A4F" }} />
            </div>
            <div className="text-[10px] text-text-light mt-1">{revPct.toFixed(1)}% of ₦100M threshold</div>
          </div>
          <div>
            <div className={labelCls}>VAT Registration</div>
            <div className="text-lg font-bold">{vatReg ? "Registered" : "Not registered"}</div>
            {!vatReg && revenueYtd >= 25_000_000 * 0.8 && (
              <div className="text-[10px] text-amber-700 mt-1">⚠ Approaching ₦25M — register before crossing.</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={cardCls}>
          <h3 className="font-semibold text-sm mb-3">Corporate Income Tax (CIT)</h3>
          <div className="space-y-1 text-sm">
            <Row l="Assessable profit YTD" v={ngnToKoboNum(assessableProfit)} />
            <Row l={`CIT Rate (${citRate}%)`} v={ngnToKoboNum(citLiability)} />
            <Row l={`Development Levy (${devRate}%)`} v={ngnToKoboNum(devLiability)} />
            <Row l="Estimated CIT Liability" v={ngnToKoboNum(citLiability + devLiability)} bold highlight />
          </div>
          {small && (
            <div className="mt-3 text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-emerald-800">
              ✓ Exempt — Small companies (turnover &lt; ₦100M) pay 0% CIT and 0% Development Levy under the Nigeria Tax Act 2025.
            </div>
          )}
        </div>

        <div className={cardCls}>
          <h3 className="font-semibold text-sm mb-3">Value Added Tax (VAT)</h3>
          <div className="space-y-1 text-sm">
            <Row l={`VAT Output (${vatRate}% of revenue)`} v={ngnToKoboNum(vatOutput)} />
            <Row l={`VAT Input credit (${vatRate}% of COGS)`} v={ngnToKoboNum(vatInput)} />
            <Row l="Net VAT Payable" v={ngnToKoboNum(vatNet)} bold highlight />
          </div>
          <div className="mt-3 text-[10px] text-text-light">
            Filing deadline: 21st of each following month. Some maternity / baby essentials may be zero-rated — verify with a tax consultant.
          </div>
        </div>

        <div className={cardCls}>
          <h3 className="font-semibold text-sm mb-3">PAYE ({year})</h3>
          <div className="space-y-1 text-sm">
            <Row l="Total PAYE deducted YTD" v={totalPaye} bold highlight />
          </div>
        </div>

        <div className={cardCls}>
          <h3 className="font-semibold text-sm mb-3">Pension ({year})</h3>
          <div className="space-y-1 text-sm">
            <Row l="Total Pension (employee + employer)" v={totalPension} bold highlight />
          </div>
        </div>

        <div className={cardCls}>
          <h3 className="font-semibold text-sm mb-3">Other Levies</h3>
          <div className="space-y-1 text-sm">
            <Row l="NSITF YTD (1% monthly payroll)" v={totalNsitf} />
            <Row l="ITF YTD (1% annual payroll)" v={totalItf} />
            <Row l="Total Levies" v={totalNsitf + totalItf} bold />
          </div>
        </div>

        <div className={cardCls}>
          <h3 className="font-semibold text-sm mb-3">WHT Tracking</h3>
          <div className="text-xs text-text-light">Track WHT withheld from vendor payments — log each as a tax expense from the Expenses tab.</div>
          <div className="mt-2 text-sm">Goods: {settings?.wht_rate_goods ?? 5}% · Services: {settings?.wht_rate_services ?? 10}%</div>
        </div>
      </div>

      <div className={cardCls}>
        <h3 className="font-semibold text-sm mb-3">Tax Calendar ({year})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="py-2 pr-2">Month</th>
                <th className="py-2 pr-2 text-right">PAYE Due</th>
                <th className="py-2 pr-2 text-right">Pension Due</th>
                <th className="py-2 pr-2 text-right">NSITF Due</th>
                <th className="py-2 pr-2">Deadlines</th>
              </tr>
            </thead>
            <tbody>
              {calendar.map(r => (
                <tr key={r.month} className="border-b border-border">
                  <td className="py-1.5 pr-2">{r.label}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{fmtNaira(r.paye)}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{fmtNaira(r.pension)}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{fmtNaira(r.nsitf)}</td>
                  <td className="py-1.5 pr-2 text-[10px] text-text-light">PAYE 10th · Pension 7d · NSITF 16th</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold border-t-2 border-border">
                <td className="py-2 pr-2">Total</td>
                <td className="py-2 pr-2 text-right tabular-nums">{fmtNaira(totalPaye)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{fmtNaira(totalPension)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{fmtNaira(totalNsitf)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// PAGE 7 — ASSETS
// ================================================================
function AssetsTab() {
  const { data: assets } = useFinanceAssets();
  const addA = useAddAsset();
  const delA = useDeleteAsset();

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<any>({
    asset_name: "", asset_type: "equipment", purchase_date: today, purchase_cost: "",
    useful_life_years: "5", depreciation_method: "straight_line", residual_value: "", notes: "",
  });

  const cost = Number(form.purchase_cost) || 0;
  const life = Math.max(1, Number(form.useful_life_years) || 1);
  const residual = Number(form.residual_value) || 0;
  const annualDep = Math.max(0, (cost - residual) / life);
  const monthlyDep = annualDep / 12;

  const canSave = form.asset_name.trim() && cost > 0 && life > 0 && form.purchase_date;

  const handleSave = () => {
    addA.mutate({
      asset_name: form.asset_name.trim(),
      asset_type: form.asset_type,
      purchase_date: form.purchase_date,
      purchase_cost: toKobo(cost),
      useful_life_years: life,
      depreciation_method: form.depreciation_method,
      residual_value: toKobo(residual),
      is_active: true,
      notes: form.notes?.trim() || null,
    }, {
      onSuccess: () => setForm({ ...form, asset_name: "", purchase_cost: "", residual_value: "", notes: "" }),
    });
  };

  const totalMonthlyDep = sumKobo(assets, "monthly_depreciation");
  const totalCost = sumKobo(assets, "purchase_cost");
  const totalBV = (assets || []).reduce((s, a) => s + bookValue(a), 0);

  // Show depreciation schedule for first selected asset
  const [selId, setSelId] = useState<string>("");
  const selected = (assets || []).find(a => a.id === selId) || (assets || [])[0];

  const schedule = useMemo(() => {
    if (!selected) return [];
    const rows: Array<{ year: number; dep: number; book: number }> = [];
    const residual = selected.residual_value || 0;
    const annual = selected.annual_depreciation || 0;
    const startYear = new Date(selected.purchase_date).getFullYear();
    let bv = selected.purchase_cost;
    for (let y = 0; y < selected.useful_life_years; y++) {
      bv = Math.max(residual, bv - annual);
      rows.push({ year: startYear + y, dep: annual, book: bv });
    }
    return rows;
  }, [selected]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KpiCard title="Total Asset Cost" value={fmtNaira(totalCost)} />
        <KpiCard title="Current Book Value" value={fmtNaira(totalBV)} />
        <KpiCard title="Monthly Depreciation" value={fmtNaira(totalMonthlyDep)} subtitle="Feeds into P&L" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={cardCls}>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add asset</h3>
          <div className="space-y-2">
            <div>
              <label className={labelCls}>Asset Name</label>
              <input value={form.asset_name} onChange={e => setForm({ ...form, asset_name: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Asset Type</label>
              <select value={form.asset_type} onChange={e => setForm({ ...form, asset_type: e.target.value })} className={inputCls}>
                {["equipment","furniture","computer","vehicle","software","other"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Purchase Date</label>
              <input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Purchase Cost (₦)</label>
              <input type="number" min="0" value={form.purchase_cost} onChange={e => setForm({ ...form, purchase_cost: e.target.value })} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Useful Life (yrs)</label>
                <input type="number" min="1" value={form.useful_life_years} onChange={e => setForm({ ...form, useful_life_years: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Residual Value (₦)</label>
                <input type="number" min="0" value={form.residual_value} onChange={e => setForm({ ...form, residual_value: e.target.value })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Depreciation Method</label>
              <select value={form.depreciation_method} onChange={e => setForm({ ...form, depreciation_method: e.target.value })} className={inputCls}>
                <option value="straight_line">Straight Line</option>
                <option value="declining_balance">Declining Balance</option>
              </select>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between"><span>Annual dep:</span><span className="tabular-nums font-semibold">{fmtNaira(toKobo(annualDep))}</span></div>
              <div className="flex justify-between"><span>Monthly dep:</span><span className="tabular-nums font-semibold">{fmtNaira(toKobo(monthlyDep))}</span></div>
            </div>
            <button disabled={!canSave || addA.isPending} onClick={handleSave} className={btnPrimary + " w-full justify-center"}>
              <Save className="w-4 h-4" /> Save asset
            </button>
          </div>
        </div>

        <div className={cardCls + " lg:col-span-2"}>
          <h3 className="font-semibold text-sm mb-3">Asset Register ({assets?.length || 0})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-2 pr-2">Asset</th>
                  <th className="py-2 pr-2">Type</th>
                  <th className="py-2 pr-2 text-right">Cost</th>
                  <th className="py-2 pr-2 text-center">Life</th>
                  <th className="py-2 pr-2 text-right">Annual</th>
                  <th className="py-2 pr-2 text-right">Monthly</th>
                  <th className="py-2 pr-2 text-right">Book Value</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {(assets || []).length === 0 && (
                  <tr><td colSpan={8} className="text-center py-6 text-text-light">No assets recorded</td></tr>
                )}
                {(assets || []).map(a => (
                  <tr key={a.id} onClick={() => setSelId(a.id)} className={`border-b border-border cursor-pointer hover:bg-muted/30 ${selId === a.id ? "bg-forest/5" : ""}`}>
                    <td className="py-1.5 pr-2">{a.asset_name}</td>
                    <td className="py-1.5 pr-2 capitalize">{a.asset_type}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{fmtNaira(a.purchase_cost)}</td>
                    <td className="py-1.5 pr-2 text-center">{a.useful_life_years}y</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{fmtNaira(a.annual_depreciation)}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{fmtNaira(a.monthly_depreciation)}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums font-semibold">{fmtNaira(bookValue(a))}</td>
                    <td className="py-1.5 text-right">
                      <button onClick={(e) => { e.stopPropagation(); if (confirm("Delete asset?")) delA.mutate(a.id); }}
                        className="text-red-600 hover:text-red-800"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected && (
            <div className="mt-4">
              <div className={sectionCls}>Depreciation schedule — {selected.asset_name}</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="py-1 pr-2">Year</th>
                    <th className="py-1 pr-2 text-right">Depreciation</th>
                    <th className="py-1 pr-2 text-right">Book Value</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map(s => (
                    <tr key={s.year} className="border-b border-border/50">
                      <td className="py-1 pr-2">{s.year}</td>
                      <td className="py-1 pr-2 text-right tabular-nums">{fmtNaira(s.dep)}</td>
                      <td className="py-1 pr-2 text-right tabular-nums">{fmtNaira(s.book)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ================================================================
// PAGE 8 — SETTINGS
// ================================================================
function SettingsTab() {
  const { data: settings } = useFinanceTaxSettings();
  const upd = useUpdateTaxSettings();
  const [draft, setDraft] = useState<TaxSettings | null>(null);

  // Sync draft
  useMemo(() => {
    if (settings && !draft) setDraft(settings);
  }, [settings, draft]);

  if (!draft) {
    return <div className={cardCls}><div className="text-center text-xs text-text-light py-6">Loading settings…</div></div>;
  }

  const save = () => upd.mutate(draft);
  const autoSmall = Number(draft.annual_turnover_threshold) >= 100_000_000_000 /* kobo */ ? true : true; // placeholder
  const setBands = (bands: PayeBand[]) => setDraft({ ...draft, paye_bands: bands });

  const addBand = () => {
    const last = draft.paye_bands[draft.paye_bands.length - 1];
    setBands([...draft.paye_bands, { from: last?.to ?? 0, to: null, rate: 0 }]);
  };

  return (
    <div className="space-y-4">
      <div className={cardCls}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Company Tax Classification</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-light">Fiscal Year</span>
            <input type="number" value={draft.fiscal_year} onChange={e => setDraft({ ...draft, fiscal_year: Number(e.target.value) })}
              className="border border-border rounded-lg px-2 py-1 text-xs w-24 bg-background" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Company Size</label>
            <select value={draft.company_size} onChange={e => {
              const sz = e.target.value;
              setDraft({ ...draft, company_size: sz, cit_rate: sz === "small" ? 0 : 25, development_levy_rate: sz === "small" ? 0 : 4 });
            }} className={inputCls}>
              <option value="small">Small ({"< ₦100M"})</option>
              <option value="large">Large (≥ ₦100M)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Turnover Threshold (₦)</label>
            <input type="number" value={Number(draft.annual_turnover_threshold) / 100} onChange={e => setDraft({ ...draft, annual_turnover_threshold: ngnToKoboNum(Number(e.target.value)) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>CIT Rate (%)</label>
            <input type="number" step="0.01" value={Number(draft.cit_rate)} onChange={e => setDraft({ ...draft, cit_rate: Number(e.target.value) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Development Levy Rate (%)</label>
            <input type="number" step="0.01" value={Number(draft.development_levy_rate)} onChange={e => setDraft({ ...draft, development_levy_rate: Number(e.target.value) })} className={inputCls} />
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <h3 className="font-semibold text-sm mb-3">VAT Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.vat_registered} onChange={e => setDraft({ ...draft, vat_registered: e.target.checked })} />
            VAT Registered with FIRS
          </label>
          <div>
            <label className={labelCls}>VAT Rate (%)</label>
            <input type="number" step="0.01" value={Number(draft.vat_rate)} onChange={e => setDraft({ ...draft, vat_rate: Number(e.target.value) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>WHT Goods (%)</label>
            <input type="number" step="0.01" value={Number(draft.wht_rate_goods)} onChange={e => setDraft({ ...draft, wht_rate_goods: Number(e.target.value) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>WHT Services (%)</label>
            <input type="number" step="0.01" value={Number(draft.wht_rate_services)} onChange={e => setDraft({ ...draft, wht_rate_services: Number(e.target.value) })} className={inputCls} />
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <h3 className="font-semibold text-sm mb-3">Payroll Rates</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className={labelCls}>Employee Pension (%)</label>
            <input type="number" step="0.01" value={Number(draft.employee_pension_rate)} onChange={e => setDraft({ ...draft, employee_pension_rate: Number(e.target.value) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Employer Pension (%)</label>
            <input type="number" step="0.01" value={Number(draft.employer_pension_rate)} onChange={e => setDraft({ ...draft, employer_pension_rate: Number(e.target.value) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>NHF (%)</label>
            <input type="number" step="0.01" value={Number(draft.nhf_rate)} onChange={e => setDraft({ ...draft, nhf_rate: Number(e.target.value) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>NSITF (%)</label>
            <input type="number" step="0.01" value={Number(draft.nsitf_rate)} onChange={e => setDraft({ ...draft, nsitf_rate: Number(e.target.value) })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>ITF (%)</label>
            <input type="number" step="0.01" value={Number(draft.itf_rate)} onChange={e => setDraft({ ...draft, itf_rate: Number(e.target.value) })} className={inputCls} />
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">PAYE Bands (NTA 2025)</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setBands(NTA_2025_PAYE_BANDS)} className={btnGhost}>Reset to NTA 2025 defaults</button>
            <button onClick={addBand} className={btnGhost}><Plus className="w-3.5 h-3.5" /> Add band</button>
          </div>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left border-b border-border">
              <th className="py-2 pr-2">From (₦)</th>
              <th className="py-2 pr-2">To (₦)</th>
              <th className="py-2 pr-2">Rate %</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {draft.paye_bands.map((b, i) => (
              <tr key={i} className="border-b border-border">
                <td className="py-1.5 pr-2">
                  <input type="number" value={b.from} onChange={e => {
                    const bands = [...draft.paye_bands];
                    bands[i] = { ...bands[i], from: Number(e.target.value) };
                    setBands(bands);
                  }} className={inputCls} />
                </td>
                <td className="py-1.5 pr-2">
                  <input type="number" value={b.to ?? ""} placeholder="(no cap)" onChange={e => {
                    const bands = [...draft.paye_bands];
                    bands[i] = { ...bands[i], to: e.target.value ? Number(e.target.value) : null };
                    setBands(bands);
                  }} className={inputCls} />
                </td>
                <td className="py-1.5 pr-2">
                  <input type="number" step="0.01" value={b.rate} onChange={e => {
                    const bands = [...draft.paye_bands];
                    bands[i] = { ...bands[i], rate: Number(e.target.value) };
                    setBands(bands);
                  }} className={inputCls} />
                </td>
                <td className="py-1.5 text-right">
                  <button onClick={() => setBands(draft.paye_bands.filter((_, j) => j !== i))}
                    className="text-red-600 hover:text-red-800"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={cardCls}>
        <h3 className="font-semibold text-sm mb-3">Remittance Reminders</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <div className={labelCls}>PAYE reminder</div>
            <div>Default: 8th of month (2 days before deadline)</div>
          </div>
          <div>
            <div className={labelCls}>Pension reminder</div>
            <div>Default: 5 days after payroll run</div>
          </div>
          <div>
            <div className={labelCls}>NSITF reminder</div>
            <div>Default: 14th of month</div>
          </div>
        </div>
        <div className="text-[10px] text-text-light mt-2">Email / in-app toggles coming soon — reminders currently shown on Dashboard + Tax Position pages.</div>
      </div>

      <div className="flex justify-end">
        <button disabled={upd.isPending} onClick={save} className={btnPrimary}>
          <Save className="w-4 h-4" /> {upd.isPending ? "Saving…" : "Save settings"}
        </button>
      </div>
      {autoSmall === false && null /* keep compiler happy */}
    </div>
  );
}


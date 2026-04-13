import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Package, ClipboardList, TrendingUp, AlertTriangle, Activity, Plus, FileText, Settings, DollarSign, XCircle, RotateCcw, Clock, ShieldX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/useAdminPermissionsContext";

const DATE_PRESETS = [
  { label: "Today", getDates: () => { const s = new Date(); s.setHours(0,0,0,0); const e = new Date(s); e.setDate(e.getDate()+1); const ps = new Date(s); ps.setDate(ps.getDate()-1); return { start: s, end: e, prevStart: ps, prevEnd: s }; }},
  { label: "Yesterday", getDates: () => { const s = new Date(); s.setDate(s.getDate()-1); s.setHours(0,0,0,0); const e = new Date(s); e.setDate(e.getDate()+1); const ps = new Date(s); ps.setDate(ps.getDate()-1); return { start: s, end: e, prevStart: ps, prevEnd: s }; }},
  { label: "This Week", getDates: () => { const s = new Date(); s.setDate(s.getDate()-s.getDay()); s.setHours(0,0,0,0); const e = new Date(); e.setDate(e.getDate()+1); e.setHours(0,0,0,0); const ps = new Date(s); ps.setDate(ps.getDate()-7); return { start: s, end: e, prevStart: ps, prevEnd: s }; }},
  { label: "This Month", getDates: () => { const s = new Date(); s.setDate(1); s.setHours(0,0,0,0); const e = new Date(); e.setDate(e.getDate()+1); e.setHours(0,0,0,0); const ps = new Date(s); ps.setMonth(ps.getMonth()-1); return { start: s, end: e, prevStart: ps, prevEnd: s }; }},
];

const fmt = (n: number) => `₦${n.toLocaleString()}`;
const pctChange = (curr: number, prev: number) => prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 1000) / 10;

export default function AdminDashboard() {
  const { can, loading: permLoading } = usePermissions();
  const queryClient = useQueryClient();
  const [preset, setPreset] = useState("This Month");


  // Realtime new order toast
  useEffect(() => {
    const channel = supabase.channel("dashboard-new-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        const o = payload.new as any;
        toast.success(`New order received — ${o.order_number || "New Order"}`, { duration: 6000 });
        queryClient.invalidateQueries({ queryKey: ["dashboard-orders"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const dates = useMemo(() => DATE_PRESETS.find(p => p.label === preset)!.getDates(), [preset]);

  const { data: products } = useQuery({
    queryKey: ["dashboard-products"],
    queryFn: async () => {
      const { count } = await supabase.from("products").select("id", { count: "exact" }).eq("is_active", true);
      return count || 0;
    },
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ["dashboard-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("id, total, payment_status, order_status, created_at");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["dashboard-recent-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: lowStock } = useQuery({
    queryKey: ["dashboard-low-stock"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("brand_name, stock_quantity, product_id, products(name)").lt("stock_quantity", 10).not("stock_quantity", "is", null);
      if (error) throw error;
      return data;
    },
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: async () => {
      const { data, error } = await supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(15);
      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    if (!orders) return null;
    const inRange = orders.filter((o: any) => o.created_at >= dates.start.toISOString() && (!dates.end || o.created_at < dates.end.toISOString()));
    const prevRange = orders.filter((o: any) => o.created_at >= dates.prevStart.toISOString() && o.created_at < dates.prevEnd.toISOString());

    const calc = (arr: any[]) => ({
      total: arr.length,
      gmv: arr.reduce((s, o) => s + (o.total || 0), 0),
      paid: arr.filter(o => o.payment_status === "paid"),
      paidCount: arr.filter(o => o.payment_status === "paid").length,
      revenue: arr.filter(o => o.payment_status === "paid").reduce((s, o) => s + (o.total || 0), 0),
      pending: arr.filter(o => o.order_status === "pending").length,
      cancelled: arr.filter(o => o.order_status === "cancelled").length,
      returned: arr.filter(o => o.order_status === "returned").length,
    });

    const curr = calc(inRange);
    const prev = calc(prevRange);

    return {
      activeProducts: products || 0,
      totalOrders: curr.total, totalOrdersChange: pctChange(curr.total, prev.total),
      gmv: curr.gmv, gmvChange: pctChange(curr.gmv, prev.gmv),
      paidOrders: curr.paidCount, paidOrdersChange: pctChange(curr.paidCount, prev.paidCount),
      revenue: curr.revenue, revenueChange: pctChange(curr.revenue, prev.revenue),
      pending: curr.pending, pendingChange: pctChange(curr.pending, prev.pending),
      cancelled: curr.cancelled, cancelledChange: pctChange(curr.cancelled, prev.cancelled),
      returned: curr.returned, returnedChange: pctChange(curr.returned, prev.returned),
    };
  }, [orders, dates, products]);

  const STATUS_COLORS: Record<string, string> = {
    confirmed: "bg-blue-100 text-blue-700", processing: "bg-yellow-100 text-yellow-700",
    packed: "bg-purple-100 text-purple-700", shipped: "bg-cyan-100 text-cyan-700",
    delivered: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700",
    pending: "bg-gray-100 text-gray-700",
  };

  const cards = stats ? [
    { label: "Active Products", value: stats.activeProducts, change: null, icon: Package, color: "text-forest" },
    { label: "Total Orders", value: stats.totalOrders, change: stats.totalOrdersChange, icon: ClipboardList, color: "text-forest" },
    { label: "GMV", value: fmt(stats.gmv), change: stats.gmvChange, icon: DollarSign, color: "text-coral" },
    { label: "Paid Orders", value: stats.paidOrders, change: stats.paidOrdersChange, icon: ClipboardList, color: "text-forest" },
    { label: "Revenue", value: fmt(stats.revenue), change: stats.revenueChange, icon: TrendingUp, color: "text-coral" },
    { label: "Pending", value: stats.pending, change: stats.pendingChange, icon: Clock, color: "text-yellow-600" },
    { label: "Cancelled", value: stats.cancelled, change: stats.cancelledChange, icon: XCircle, color: "text-destructive" },
    { label: "Returned", value: stats.returned, change: stats.returnedChange, icon: RotateCcw, color: "text-orange-600" },
  ] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="pf text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="flex gap-2">
          {DATE_PRESETS.map(p => (
            <button key={p.label} onClick={() => setPreset(p.label)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${preset === p.label ? "border-forest bg-forest/10 text-forest" : "border-border text-muted-foreground"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Array.from({length:8}).map((_,i)=><Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {cards.map(c => (
            <div key={c.label} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-xs font-semibold">{c.label}</span>
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <div className="text-2xl font-bold pf">{c.value}</div>
              {c.change !== null && (
                <div className={`text-[10px] mt-0.5 font-semibold ${c.change >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {c.change >= 0 ? "↑" : "↓"} {Math.abs(c.change).toFixed(1)}% vs prev period
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Recent Orders */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="pf text-sm font-bold">Recent Orders</h2>
            <Link to="/admin/orders" className="text-xs text-forest font-semibold hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {(recentOrders || []).slice(0, 8).map((o: any) => (
              <div key={o.id} className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold">{o.order_number || "—"}</span>
                  <span className="text-muted-foreground ml-2">{o.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[o.order_status] || "bg-muted text-muted-foreground"}`}>{o.order_status}</span>
                  <span className="font-semibold">{fmt(o.total || 0)}</span>
                </div>
              </div>
            ))}
            {(!recentOrders || recentOrders.length === 0) && <p className="text-xs text-muted-foreground">No data yet</p>}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-coral" />
            <h2 className="pf text-sm font-bold">Low Stock Alerts</h2>
          </div>
          <div className="space-y-2">
            {(lowStock || []).map((b: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold">{b.brand_name}</span>
                  <span className="text-muted-foreground ml-1">({(b.products as any)?.name})</span>
                </div>
                <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${(b.stock_quantity || 0) <= 3 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {b.stock_quantity} left
                </span>
              </div>
            ))}
            {(!lowStock || lowStock.length === 0) && <p className="text-xs text-muted-foreground">All stock levels OK ✅</p>}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="pf text-sm font-bold mb-3">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/products" className="flex items-center gap-1.5 px-3 py-2 bg-forest text-primary-foreground rounded-lg text-xs font-semibold hover:bg-forest/90"><Plus className="w-3 h-3" /> Add Product</Link>
            <Link to="/admin/orders" className="flex items-center gap-1.5 px-3 py-2 bg-coral text-primary-foreground rounded-lg text-xs font-semibold hover:bg-coral/90"><ClipboardList className="w-3 h-3" /> View Orders</Link>
            <Link to="/admin/blog" className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-xs font-semibold hover:bg-muted"><FileText className="w-3 h-3" /> Write Blog Post</Link>
            <Link to="/admin/settings" className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-xs font-semibold hover:bg-muted"><Settings className="w-3 h-3" /> Site Settings</Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-forest" />
            <h2 className="pf text-sm font-bold">Recent Activity</h2>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(recentActivity || []).map((a: any) => (
              <div key={a.id} className="text-xs flex items-start gap-2">
                <span className="text-muted-foreground whitespace-nowrap">{new Date(a.created_at).toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                <span><span className="font-semibold capitalize">{a.action}</span> {a.entity_type} {a.entity_name ? `"${a.entity_name}"` : ""}</span>
              </div>
            ))}
            {(!recentActivity || recentActivity.length === 0) && <p className="text-xs text-muted-foreground">No data yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

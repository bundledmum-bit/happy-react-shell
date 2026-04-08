import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Package, ShoppingBag, ClipboardList, TrendingUp, AlertTriangle, Activity, Plus, FileText, Settings } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, bundles, orders, analytics] = await Promise.all([
        supabase.from("products").select("id", { count: "exact" }).eq("is_active", true),
        supabase.from("bundles").select("id", { count: "exact" }).eq("is_active", true),
        supabase.from("orders").select("id, total, created_at, payment_status"),
        supabase.from("analytics_events").select("id", { count: "exact" }).eq("event_type", "quiz_completed"),
      ]);
      const allOrders = orders.data || [];
      const paidOrders = allOrders.filter((o: any) => o.payment_status === "paid");
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayOrders = paidOrders.filter((o: any) => o.created_at >= todayStart.toISOString());
      const weekOrders = paidOrders.filter((o: any) => o.created_at >= weekAgo);
      return {
        productCount: products.count || 0, bundleCount: bundles.count || 0,
        totalOrders: paidOrders.length, todayOrders: todayOrders.length, weekOrders: weekOrders.length,
        totalRevenue: paidOrders.reduce((s: number, o: any) => s + (o.total || 0), 0),
        todayRevenue: todayOrders.reduce((s: number, o: any) => s + (o.total || 0), 0),
        weekRevenue: weekOrders.reduce((s: number, o: any) => s + (o.total || 0), 0),
        quizCompletions: analytics.count || 0,
      };
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["admin-activity-log"],
    queryFn: async () => {
      const { data, error } = await supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(15);
      if (error) throw error;
      return data;
    },
  });

  const { data: lowStock } = useQuery({
    queryKey: ["admin-low-stock"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("brand_name, stock_quantity, product_id, products(name)").lt("stock_quantity", 10).not("stock_quantity", "is", null);
      if (error) throw error;
      return data;
    },
  });

  const cards = [
    { label: "Active Products", value: stats?.productCount ?? "—", icon: Package, color: "text-forest" },
    { label: "Active Bundles", value: stats?.bundleCount ?? "—", icon: ShoppingBag, color: "text-coral" },
    { label: "Total Orders", value: stats?.totalOrders ?? "—", sub: `${stats?.todayOrders ?? 0} today · ${stats?.weekOrders ?? 0} this week`, icon: ClipboardList, color: "text-forest" },
    { label: "Revenue", value: stats ? `₦${stats.totalRevenue.toLocaleString()}` : "—", sub: stats ? `₦${stats.todayRevenue.toLocaleString()} today · ₦${stats.weekRevenue.toLocaleString()} this week` : "", icon: TrendingUp, color: "text-coral" },
  ];

  const STATUS_COLORS: Record<string, string> = {
    confirmed: "bg-blue-100 text-blue-700", processing: "bg-yellow-100 text-yellow-700",
    packed: "bg-purple-100 text-purple-700", shipped: "bg-cyan-100 text-cyan-700",
    delivered: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <h1 className="pf text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map(c => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-med text-xs font-semibold">{c.label}</span>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <div className="text-2xl font-bold pf">{c.value}</div>
            {c.sub && <div className="text-text-light text-xs mt-0.5">{c.sub}</div>}
          </div>
        ))}
      </div>

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
                  <span className="text-text-light ml-2">{o.customer_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[o.order_status] || "bg-muted text-text-med"}`}>{o.order_status}</span>
                  <span className="font-semibold">₦{(o.total || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {(!recentOrders || recentOrders.length === 0) && <p className="text-xs text-text-light">No orders yet</p>}
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
                  <span className="text-text-light ml-1">({(b.products as any)?.name})</span>
                </div>
                <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${(b.stock_quantity || 0) <= 3 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {b.stock_quantity} left
                </span>
              </div>
            ))}
            {(!lowStock || lowStock.length === 0) && <p className="text-xs text-text-light">All stock levels OK ✅</p>}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="pf text-sm font-bold mb-3">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/products" className="flex items-center gap-1.5 px-3 py-2 bg-forest text-primary-foreground rounded-lg text-xs font-semibold hover:bg-forest-deep"><Plus className="w-3 h-3" /> Add Product</Link>
            <Link to="/admin/orders" className="flex items-center gap-1.5 px-3 py-2 bg-coral text-primary-foreground rounded-lg text-xs font-semibold hover:bg-coral-dark"><ClipboardList className="w-3 h-3" /> View Orders</Link>
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
                <span className="text-text-light whitespace-nowrap">{new Date(a.created_at).toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                <span><span className="font-semibold capitalize">{a.action}</span> {a.entity_type} {a.entity_name ? `"${a.entity_name}"` : ""}</span>
              </div>
            ))}
            {(!recentActivity || recentActivity.length === 0) && <p className="text-xs text-text-light">No activity logged yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingBag, ClipboardList, TrendingUp } from "lucide-react";

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
      const weekOrders = paidOrders.filter((o: any) => o.created_at >= weekAgo);

      return {
        productCount: products.count || 0,
        bundleCount: bundles.count || 0,
        totalOrders: paidOrders.length,
        weekOrders: weekOrders.length,
        totalRevenue: paidOrders.reduce((s: number, o: any) => s + (o.total || 0), 0),
        weekRevenue: weekOrders.reduce((s: number, o: any) => s + (o.total || 0), 0),
        quizCompletions: analytics.count || 0,
      };
    },
  });

  const cards = [
    { label: "Active Products", value: stats?.productCount ?? "—", icon: Package, color: "text-forest" },
    { label: "Active Bundles", value: stats?.bundleCount ?? "—", icon: ShoppingBag, color: "text-coral" },
    { label: "Total Orders", value: stats?.totalOrders ?? "—", sub: `${stats?.weekOrders ?? 0} this week`, icon: ClipboardList, color: "text-forest" },
    { label: "Revenue", value: stats ? `₦${(stats.totalRevenue).toLocaleString()}` : "—", sub: stats ? `₦${stats.weekRevenue.toLocaleString()} this week` : "", icon: TrendingUp, color: "text-coral" },
  ];

  return (
    <div>
      <h1 className="pf text-2xl font-bold text-foreground mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="pf text-lg font-bold mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <a href="/admin/products" className="px-4 py-2 bg-forest text-primary-foreground rounded-lg text-sm font-semibold hover:bg-forest-deep transition-colors">Manage Products</a>
          <a href="/admin/orders" className="px-4 py-2 bg-coral text-primary-foreground rounded-lg text-sm font-semibold hover:bg-coral-dark transition-colors">View Orders</a>
          <a href="/admin/settings" className="px-4 py-2 border border-border rounded-lg text-sm font-semibold hover:bg-muted transition-colors">Site Settings</a>
        </div>
      </div>
    </div>
  );
}

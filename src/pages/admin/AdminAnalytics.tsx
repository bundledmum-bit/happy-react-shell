import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const RANGES = [
  { label: "Today", days: 0 },
  { label: "7 Days", days: 7 },
  { label: "30 Days", days: 30 },
  { label: "90 Days", days: 90 },
];

const COLORS = ["hsl(var(--coral))", "hsl(var(--forest))", "#6366f1", "#f59e0b", "#ec4899", "#14b8a6", "#8b5cf6", "#f97316"];

export default function AdminAnalytics() {
  const [range, setRange] = useState(30);
  const [tab, setTab] = useState<"sales" | "products" | "quiz">("sales");

  const rangeDate = range === 0
    ? new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
    : new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString();

  const { data: orders } = useQuery({
    queryKey: ["analytics-orders", range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, subtotal, delivery_fee, service_fee, discount, order_status, payment_status, created_at, customer_email, delivery_state")
        .gte("created_at", rangeDate)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: orderItems } = useQuery({
    queryKey: ["analytics-items", range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("product_name, brand_name, quantity, line_total, order_id, orders!inner(created_at, payment_status)")
        .gte("orders.created_at", rangeDate);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["analytics-events", range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("event_type, event_data, created_at")
        .gte("created_at", rangeDate)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const paidOrders = (orders || []).filter((o: any) => o.payment_status === "paid" || o.payment_status === "completed");
  const totalRevenue = paidOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
  const totalOrders = paidOrders.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const itemsSold = (orderItems || []).filter((i: any) => (i.orders as any)?.payment_status === "paid").reduce((s: number, i: any) => s + (i.quantity || 0), 0);
  const uniqueCustomers = new Set(paidOrders.map((o: any) => o.customer_email)).size;

  // Revenue by day
  const revenueByDay: Record<string, number> = {};
  paidOrders.forEach((o: any) => {
    const day = o.created_at?.slice(0, 10);
    if (day) revenueByDay[day] = (revenueByDay[day] || 0) + (o.total || 0);
  });
  const dailyRevenue = Object.entries(revenueByDay).sort().map(([date, revenue]) => ({ date: date.slice(5), revenue }));

  // Orders by status
  const statusCounts: Record<string, number> = {};
  (orders || []).forEach((o: any) => { statusCounts[o.order_status || "unknown"] = (statusCounts[o.order_status || "unknown"] || 0) + 1; });
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Top products
  const productRevenue: Record<string, { name: string; revenue: number; units: number }> = {};
  (orderItems || []).filter((i: any) => (i.orders as any)?.payment_status === "paid").forEach((i: any) => {
    const key = i.product_name;
    if (!productRevenue[key]) productRevenue[key] = { name: key, revenue: 0, units: 0 };
    productRevenue[key].revenue += i.line_total || 0;
    productRevenue[key].units += i.quantity || 0;
  });
  const topProducts = Object.values(productRevenue).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  // Quiz analytics
  const evts = events || [];
  const quizStarts = evts.filter((e: any) => e.event_type === "quiz_start" || e.event_type === "quiz_started").length;
  const quizCompletes = evts.filter((e: any) => e.event_type === "quiz_complete" || e.event_type === "quiz_completed").length;
  const addToCarts = evts.filter((e: any) => e.event_type === "add_to_cart" || e.event_type === "product_added").length;
  const checkouts = evts.filter((e: any) => e.event_type === "checkout_start" || e.event_type === "checkout_started").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="pf text-2xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          {RANGES.map(r => (
            <button key={r.days} onClick={() => setRange(r.days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${range === r.days ? "border-forest bg-forest-light text-forest" : "border-border text-text-med"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Revenue", value: `₦${totalRevenue.toLocaleString()}` },
          { label: "Orders", value: totalOrders },
          { label: "Avg Order", value: `₦${avgOrderValue.toLocaleString()}` },
          { label: "Items Sold", value: itemsSold },
          { label: "Customers", value: uniqueCustomers },
        ].map(c => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-xl font-bold pf">{c.value}</div>
            <div className="text-text-light text-[10px]">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["sales", "products", "quiz"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border capitalize ${tab === t ? "border-forest bg-forest-light text-forest" : "border-border text-text-med"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "sales" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-bold mb-4 text-sm">Revenue by Day</h2>
            {dailyRevenue.length === 0 ? (
              <p className="text-text-med text-sm py-8 text-center">No revenue data for this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dailyRevenue}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `₦${v.toLocaleString()}`} />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--coral))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-bold mb-4 text-sm">Orders by Status</h2>
            {statusData.length === 0 ? (
              <p className="text-text-med text-sm py-8 text-center">No orders in this period</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {tab === "products" && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-bold mb-4 text-sm">Top Products by Revenue</h2>
          {topProducts.length === 0 ? (
            <p className="text-text-med text-sm py-8 text-center">No product data for this period</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={150} />
                  <Tooltip formatter={(v: number) => `₦${v.toLocaleString()}`} />
                  <Bar dataKey="revenue" fill="hsl(var(--forest))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-med text-xs">
                      <th className="text-left py-2">Product</th>
                      <th className="text-right py-2">Units</th>
                      <th className="text-right py-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map(p => (
                      <tr key={p.name} className="border-t border-border">
                        <td className="py-2 text-xs font-semibold">{p.name}</td>
                        <td className="py-2 text-xs text-right">{p.units}</td>
                        <td className="py-2 text-xs text-right font-semibold">₦{p.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "quiz" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-bold mb-4 text-sm">Quiz Funnel</h2>
            <div className="space-y-3">
              {[
                { label: "Quiz Started", count: quizStarts },
                { label: "Quiz Completed", count: quizCompletes },
                { label: "Added to Cart", count: addToCarts },
                { label: "Checkout Started", count: checkouts },
                { label: "Order Placed", count: totalOrders },
              ].map((step, i) => (
                <div key={step.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{step.label}</span>
                    <span className="font-semibold">{step.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${quizStarts > 0 ? Math.max((step.count / quizStarts) * 100, 2) : 0}%`,
                      backgroundColor: COLORS[i % COLORS.length],
                    }} />
                  </div>
                </div>
              ))}
            </div>
            {quizStarts > 0 && (
              <div className="mt-4 text-xs text-text-light">
                Completion rate: <span className="font-semibold">{((quizCompletes / quizStarts) * 100).toFixed(1)}%</span> · 
                Conversion: <span className="font-semibold">{((totalOrders / quizStarts) * 100).toFixed(1)}%</span>
              </div>
            )}
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-bold mb-4 text-sm">Event Summary</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Page Views", key: "page_view" },
                { label: "Product Views", key: "product_view" },
                { label: "Add to Cart", key: "add_to_cart" },
                { label: "Shares", key: "share_clicked" },
                { label: "Coupon Applied", key: "coupon_applied" },
                { label: "Checkout Start", key: "checkout_start" },
              ].map(item => (
                <div key={item.key} className="bg-muted/30 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold pf">{evts.filter((e: any) => e.event_type === item.key).length}</div>
                  <div className="text-[10px] text-text-light">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

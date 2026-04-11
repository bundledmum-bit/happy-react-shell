import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid, Legend,
} from "recharts";

const COLORS = ["#2D6A4F", "#F4845F", "#6366f1", "#f59e0b", "#ec4899", "#14b8a6", "#8b5cf6", "#f97316", "#10b981", "#ef4444"];

const DATE_PRESETS = [
  { label: "Today", days: 0 },
  { label: "Yesterday", days: 1 },
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
  { label: "This Month", days: -1 },
  { label: "Last Month", days: -2 },
  { label: "This Year", days: -3 },
];

function getDateRange(preset: string): { from: string; to: string } {
  const now = new Date();
  const to = new Date(now); to.setDate(to.getDate() + 1); to.setHours(0,0,0,0);
  const p = DATE_PRESETS.find(d => d.label === preset) || DATE_PRESETS[3];

  if (p.label === "Today") { const f = new Date(now); f.setHours(0,0,0,0); return { from: f.toISOString(), to: to.toISOString() }; }
  if (p.label === "Yesterday") { const f = new Date(now); f.setDate(f.getDate()-1); f.setHours(0,0,0,0); const t = new Date(f); t.setDate(t.getDate()+1); return { from: f.toISOString(), to: t.toISOString() }; }
  if (p.label === "This Month") { const f = new Date(now.getFullYear(), now.getMonth(), 1); return { from: f.toISOString(), to: to.toISOString() }; }
  if (p.label === "Last Month") { const f = new Date(now.getFullYear(), now.getMonth()-1, 1); const t = new Date(now.getFullYear(), now.getMonth(), 1); return { from: f.toISOString(), to: t.toISOString() }; }
  if (p.label === "This Year") { const f = new Date(now.getFullYear(), 0, 1); return { from: f.toISOString(), to: to.toISOString() }; }

  const f = new Date(now); f.setDate(f.getDate() - p.days); f.setHours(0,0,0,0);
  return { from: f.toISOString(), to: to.toISOString() };
}

const fmt = (n: number) => `₦${n.toLocaleString()}`;
const pct = (n: number, d: number) => d === 0 ? "0.0" : ((n / d) * 100).toFixed(1);

const ChartCard = ({ title, children, empty }: { title: string; children: React.ReactNode; empty?: boolean }) => (
  <div className="bg-card border border-border rounded-xl p-5">
    <h3 className="font-bold text-sm mb-4">{title}</h3>
    {empty ? <p className="text-muted-foreground text-sm py-8 text-center">No data yet</p> : children}
  </div>
);

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-card border border-border rounded-xl p-4 text-center">
    <div className="text-xl font-bold pf">{value}</div>
    <div className="text-muted-foreground text-[10px]">{label}</div>
  </div>
);

export default function AdminAnalytics() {
  const [preset, setPreset] = useState("Last 30 Days");
  const { from, to } = useMemo(() => getDateRange(preset), [preset]);

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["analytics-orders-full", from, to],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders")
        .select("id, total, subtotal, order_status, payment_status, payment_method, delivery_state, gift_wrapping, quiz_answers, customer_email, customer_name, customer_phone, refund_amount, created_at")
        .gte("created_at", from).lt("created_at", to).order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allOrders } = useQuery({
    queryKey: ["analytics-all-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("id, total, payment_status, customer_email, created_at").order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: orderItems } = useQuery({
    queryKey: ["analytics-items", from, to],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_items")
        .select("product_name, brand_name, quantity, line_total, unit_price, order_id, orders!inner(created_at, payment_status)")
        .gte("orders.created_at", from).lt("orders.created_at", to);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["analytics-events", from, to],
    queryFn: async () => {
      const { data, error } = await supabase.from("analytics_events")
        .select("event_type, event_data, session_id, page_url, referral_source, created_at")
        .gte("created_at", from).lt("created_at", to).order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: quizLeads } = useQuery({
    queryKey: ["analytics-quiz-leads", from, to],
    queryFn: async () => {
      const { data, error } = await supabase.from("quiz_customers")
        .select("*").gte("created_at", from).lt("created_at", to).order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: customers } = useQuery({
    queryKey: ["analytics-customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id, email, total_spent, total_orders, delivery_state, created_at");
      if (error) throw error;
      return data || [];
    },
  });

  // Derived data
  const o = orders || [];
  const paid = o.filter((x: any) => x.payment_status === "paid");
  const revenue = paid.reduce((s: number, x: any) => s + (x.total || 0), 0);
  const gmv = o.reduce((s: number, x: any) => s + (x.total || 0), 0);
  const refunds = o.reduce((s: number, x: any) => s + (x.refund_amount || 0), 0);
  const aov = paid.length > 0 ? Math.round(revenue / paid.length) : 0;
  const evts = events || [];
  const leads = quizLeads || [];
  const items = orderItems || [];

  // Helper: group by day
  const groupByDay = (arr: any[], valueFn: (items: any[]) => number) => {
    const map: Record<string, any[]> = {};
    arr.forEach(x => { const d = (x.created_at || "").slice(0, 10); if (d) { if (!map[d]) map[d] = []; map[d].push(x); } });
    return Object.entries(map).sort().map(([date, items]) => ({ date: date.slice(5), value: valueFn(items) }));
  };

  if (ordersLoading) return (
    <div>
      <h1 className="pf text-2xl font-bold mb-6">Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-20 rounded-xl" />)}</div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="pf text-2xl font-bold">Analytics</h1>
        <div className="flex gap-1.5 flex-wrap">
          {DATE_PRESETS.map(p => (
            <button key={p.label} onClick={() => setPreset(p.label)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${preset === p.label ? "border-forest bg-forest/10 text-forest" : "border-border text-muted-foreground"}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="business">Business Overview</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="quiz">Quiz & Leads</TabsTrigger>
          <TabsTrigger value="products">Products & Bundles</TabsTrigger>
          <TabsTrigger value="marketing">Marketing & Traffic</TabsTrigger>
          <TabsTrigger value="cohort">Cohort Analysis</TabsTrigger>
        </TabsList>

        {/* TAB 1: BUSINESS OVERVIEW */}
        <TabsContent value="business">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <StatCard label="Revenue" value={fmt(revenue)} />
            <StatCard label="GMV" value={fmt(gmv)} />
            <StatCard label="Orders" value={o.length} />
            <StatCard label="AOV" value={fmt(aov)} />
            <StatCard label="Gift Wrap %" value={`${pct(o.filter((x:any)=>x.gift_wrapping).length, o.length)}%`} />
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <ChartCard title="Revenue Over Time" empty={paid.length === 0}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={groupByDay(paid, items => items.reduce((s,x) => s + (x.total||0), 0))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Line type="monotone" dataKey="value" stroke="#2D6A4F" strokeWidth={2} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Orders Over Time" empty={o.length === 0}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={groupByDay(o, items => items.length)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#F4845F" radius={[4,4,0,0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Orders by Status" empty={o.length === 0}>
              {(() => {
                const sc: Record<string, number> = {};
                o.forEach((x: any) => { sc[x.order_status || "unknown"] = (sc[x.order_status || "unknown"] || 0) + 1; });
                const data = Object.entries(sc).map(([name, value]) => ({ name, value }));
                return (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,value})=>`${name}: ${value}`}>
                      {data.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Pie><Tooltip /></PieChart>
                  </ResponsiveContainer>
                );
              })()}
            </ChartCard>

            <ChartCard title="Orders by Payment Method" empty={o.length === 0}>
              {(() => {
                const mc: Record<string, number> = {};
                o.forEach((x: any) => { mc[x.payment_method || "unknown"] = (mc[x.payment_method || "unknown"] || 0) + 1; });
                const data = Object.entries(mc).map(([name, value]) => ({ name, value }));
                return (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart><Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,value})=>`${name}: ${value}`}>
                      {data.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Pie><Tooltip /></PieChart>
                  </ResponsiveContainer>
                );
              })()}
            </ChartCard>

            <ChartCard title="Orders by Delivery State (Top 10)" empty={o.length === 0}>
              {(() => {
                const sc: Record<string, number> = {};
                o.forEach((x: any) => { if (x.delivery_state) sc[x.delivery_state] = (sc[x.delivery_state] || 0) + 1; });
                const data = Object.entries(sc).sort((a,b) => b[1]-a[1]).slice(0,10).map(([name,value]) => ({ name, value }));
                return (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                      <Tooltip /><Bar dataKey="value" fill="#2D6A4F" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </ChartCard>

            <ChartCard title="Top 10 Products by Order Volume" empty={items.length === 0}>
              {(() => {
                const pc: Record<string, number> = {};
                items.filter((i:any)=>(i.orders as any)?.payment_status==="paid").forEach((i:any) => { pc[i.product_name] = (pc[i.product_name] || 0) + (i.quantity || 0); });
                const data = Object.entries(pc).sort((a,b) => b[1]-a[1]).slice(0,10).map(([name,value]) => ({ name, value }));
                return (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                      <Tooltip /><Bar dataKey="value" fill="#F4845F" radius={[0,4,4,0]} name="Units" />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </ChartCard>
          </div>
        </TabsContent>

        {/* TAB 2: CUSTOMERS */}
        <TabsContent value="customers">
          {(() => {
            const c = customers || [];
            const allO = allOrders || [];
            const emailOrders: Record<string, number> = {};
            allO.forEach((x: any) => { emailOrders[x.customer_email] = (emailOrders[x.customer_email] || 0) + 1; });
            const returning = Object.values(emailOrders).filter(v => v > 1).length;
            const total = Object.keys(emailOrders).length;
            const repeatRate = total > 0 ? ((returning / total) * 100).toFixed(1) : "0.0";
            const topCustomers = c.sort((a: any, b: any) => (b.total_spent || 0) - (a.total_spent || 0)).slice(0, 10);
            const geoData: Record<string, number> = {};
            c.forEach((x: any) => { if (x.delivery_state) geoData[x.delivery_state] = (geoData[x.delivery_state] || 0) + 1; });
            const geoChart = Object.entries(geoData).sort((a,b) => b[1]-a[1]).slice(0,10).map(([name,value]) => ({ name, value }));

            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <StatCard label="Total Customers" value={total} />
                  <StatCard label="Returning" value={returning} />
                  <StatCard label="Repeat Rate" value={`${repeatRate}%`} />
                  <StatCard label="Avg LTV" value={fmt(c.length > 0 ? Math.round(c.reduce((s: number,x: any) => s+(x.total_spent||0), 0)/c.length) : 0)} />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <ChartCard title="Top 10 Customers by Spend" empty={topCustomers.length === 0}>
                    <div className="space-y-2">
                      {topCustomers.map((c: any,i: number) => (
                        <div key={c.id} className="flex justify-between text-xs">
                          <span>{i+1}. {c.email}</span>
                          <span className="font-semibold">{fmt(c.total_spent || 0)} ({c.total_orders} orders)</span>
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                  <ChartCard title="Geographic Distribution" empty={geoChart.length === 0}>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={geoChart} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                        <Tooltip /><Bar dataKey="value" fill="#2D6A4F" radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </>
            );
          })()}
        </TabsContent>

        {/* TAB 3: QUIZ & LEADS */}
        <TabsContent value="quiz">
          {(() => {
            const quizStarts = evts.filter((e: any) => e.event_type === "quiz_started").length;
            const quizCompletes = evts.filter((e: any) => e.event_type === "quiz_completed").length;
            const completionRate = quizStarts > 0 ? ((quizCompletes / quizStarts) * 100).toFixed(1) : "0.0";
            const purchased = leads.filter((l: any) => l.has_purchased).length;
            const conversionRate = leads.length > 0 ? ((purchased / leads.length) * 100).toFixed(1) : "0.0";
            const whatsappCapture = leads.filter((l: any) => l.whatsapp_number).length;
            const whatsappRate = leads.length > 0 ? ((whatsappCapture / leads.length) * 100).toFixed(1) : "0.0";

            const makeDonut = (field: string) => {
              const counts: Record<string, number> = {};
              leads.forEach((l: any) => { const v = l[field] || "unknown"; counts[v] = (counts[v] || 0) + 1; });
              return Object.entries(counts).map(([name, value]) => ({ name, value }));
            };

            const leadsOverTime = groupByDay(leads, items => items.length);

            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  <StatCard label="Quiz Starts" value={quizStarts} />
                  <StatCard label="Quiz Completions" value={quizCompletes} />
                  <StatCard label="Completion Rate" value={`${completionRate}%`} />
                  <StatCard label="Conversion Rate" value={`${conversionRate}%`} />
                  <StatCard label="WhatsApp Capture" value={`${whatsappRate}%`} />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { title: "By Hospital Type", data: makeDonut("hospital_type") },
                    { title: "By Delivery Method", data: makeDonut("delivery_method") },
                    { title: "By Baby Gender", data: makeDonut("baby_gender") },
                    { title: "By Budget Tier", data: makeDonut("budget_tier") },
                    { title: "Purchased vs Not", data: [{ name: "Purchased", value: purchased }, { name: "Not Purchased", value: leads.length - purchased }] },
                  ].map(chart => (
                    <ChartCard key={chart.title} title={chart.title} empty={chart.data.length === 0}>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart><Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,value})=>`${name}: ${value}`}>
                          {chart.data.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                        </Pie><Tooltip /></PieChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  ))}
                  <ChartCard title="Quiz Leads Over Time" empty={leadsOverTime.length === 0}>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={leadsOverTime}>
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip /><Bar dataKey="value" fill="#2D6A4F" radius={[4,4,0,0]} name="Leads" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
              </>
            );
          })()}
        </TabsContent>

        {/* TAB 4: PRODUCTS & BUNDLES */}
        <TabsContent value="products">
          {(() => {
            const paidItems = items.filter((i: any) => (i.orders as any)?.payment_status === "paid");
            const productRevenue: Record<string, { name: string; revenue: number; units: number }> = {};
            paidItems.forEach((i: any) => {
              if (!productRevenue[i.product_name]) productRevenue[i.product_name] = { name: i.product_name, revenue: 0, units: 0 };
              productRevenue[i.product_name].revenue += i.line_total || 0;
              productRevenue[i.product_name].units += i.quantity || 0;
            });
            const topByRevenue = Object.values(productRevenue).sort((a,b) => b.revenue - a.revenue).slice(0, 10);
            const topByFreq = Object.values(productRevenue).sort((a,b) => b.units - a.units).slice(0, 10);

            // Tier & hospital from quiz_answers
            const tierCounts: Record<string, number> = {};
            const hospitalCounts: Record<string, number> = {};
            o.forEach((x: any) => {
              const qa = x.quiz_answers as any;
              if (qa?.budget_tier) tierCounts[qa.budget_tier] = (tierCounts[qa.budget_tier] || 0) + 1;
              if (qa?.hospital_type) hospitalCounts[qa.hospital_type] = (hospitalCounts[qa.hospital_type] || 0) + 1;
            });

            return (
              <div className="grid md:grid-cols-2 gap-6">
                <ChartCard title="Top 10 Products by Revenue" empty={topByRevenue.length === 0}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topByRevenue} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₦${(v/1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                      <Tooltip formatter={(v: number) => fmt(v)} /><Bar dataKey="revenue" fill="#2D6A4F" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Top 10 Products by Frequency" empty={topByFreq.length === 0}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topByFreq} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                      <Tooltip /><Bar dataKey="units" fill="#F4845F" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Tier Breakdown (from Quiz)" empty={Object.keys(tierCounts).length === 0}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart><Pie data={Object.entries(tierCounts).map(([name,value])=>({name,value}))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {Object.keys(tierCounts).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Pie><Tooltip /></PieChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Hospital Type Breakdown" empty={Object.keys(hospitalCounts).length === 0}>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart><Pie data={Object.entries(hospitalCounts).map(([name,value])=>({name,value}))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {Object.keys(hospitalCounts).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                    </Pie><Tooltip /></PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            );
          })()}
        </TabsContent>

        {/* TAB 5: MARKETING & TRAFFIC */}
        <TabsContent value="marketing">
          {(() => {
            const sessionsByDay: Record<string, Set<string>> = {};
            evts.forEach((e: any) => {
              const d = (e.created_at || "").slice(0, 10);
              if (d && e.session_id) { if (!sessionsByDay[d]) sessionsByDay[d] = new Set(); sessionsByDay[d].add(e.session_id); }
            });
            const sessionsChart = Object.entries(sessionsByDay).sort().map(([date, set]) => ({ date: date.slice(5), value: set.size }));

            const refSources: Record<string, number> = {};
            evts.forEach((e: any) => { const r = e.referral_source || "direct"; refSources[r] = (refSources[r] || 0) + 1; });
            const refChart = Object.entries(refSources).sort((a,b) => b[1]-a[1]).slice(0,10).map(([name,value]) => ({ name, value }));

            const topPages: Record<string, number> = {};
            evts.forEach((e: any) => { if (e.page_url) topPages[e.page_url] = (topPages[e.page_url] || 0) + 1; });
            const pagesChart = Object.entries(topPages).sort((a,b) => b[1]-a[1]).slice(0,10).map(([name,value]) => ({ name, value }));

            // Funnel
            const quizStarted = evts.filter((e:any) => e.event_type === "quiz_started").length;
            const quizCompleted = evts.filter((e:any) => e.event_type === "quiz_completed").length;
            const checkoutStarted = evts.filter((e:any) => e.event_type === "checkout_started").length;
            const orderPlaced = evts.filter((e:any) => e.event_type === "order_placed").length;

            // Cart abandonment
            const checkoutSessions = new Set(evts.filter((e:any) => e.event_type === "checkout_started").map((e:any) => e.session_id));
            const orderSessions = new Set(evts.filter((e:any) => e.event_type === "order_placed").map((e:any) => e.session_id));
            const abandoned = [...checkoutSessions].filter(s => !orderSessions.has(s)).length;
            const abandonRate = checkoutSessions.size > 0 ? ((abandoned / checkoutSessions.size) * 100).toFixed(1) : "0.0";
            const convRate = quizStarted > 0 ? ((orderPlaced / quizStarted) * 100).toFixed(1) : "0.0";

            const funnel = [
              { step: "Quiz Started", count: quizStarted },
              { step: "Quiz Completed", count: quizCompleted },
              { step: "Checkout Started", count: checkoutStarted },
              { step: "Order Placed", count: orderPlaced },
            ];

            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  <StatCard label="Cart Abandonment" value={`${abandonRate}%`} />
                  <StatCard label="Conversion Rate" value={`${convRate}%`} />
                  <StatCard label="Sessions" value={Object.values(sessionsByDay).reduce((s, set) => s + set.size, 0)} />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <ChartCard title="Sessions Over Time" empty={sessionsChart.length === 0}>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={sessionsChart}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip /><Line type="monotone" dataKey="value" stroke="#2D6A4F" strokeWidth={2} name="Sessions" />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Funnel" empty={quizStarted === 0}>
                    <div className="space-y-3">
                      {funnel.map((step, i) => (
                        <div key={step.step}>
                          <div className="flex justify-between text-xs mb-1">
                            <span>{step.step}</span>
                            <span className="font-semibold">{step.count} {i > 0 && quizStarted > 0 && <span className="text-muted-foreground">({pct(step.count, quizStarted)}%)</span>}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${quizStarted > 0 ? Math.max((step.count/quizStarted)*100, 2) : 0}%`, backgroundColor: COLORS[i%COLORS.length] }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ChartCard>

                  <ChartCard title="Traffic by Referral Source" empty={refChart.length === 0}>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={refChart} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                        <Tooltip /><Bar dataKey="value" fill="#F4845F" radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="Top Pages Visited" empty={pagesChart.length === 0}>
                    <div className="space-y-2">
                      {pagesChart.map((p, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="truncate max-w-[200px]">{p.name}</span>
                          <span className="font-semibold">{p.value}</span>
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                </div>
              </>
            );
          })()}
        </TabsContent>

        {/* TAB 6: COHORT ANALYSIS */}
        <TabsContent value="cohort">
          {(() => {
            const allO = allOrders || [];
            // Group customers by first order month
            const customerFirstOrder: Record<string, string> = {};
            allO.forEach((o: any) => {
              const month = (o.created_at || "").slice(0, 7);
              if (!customerFirstOrder[o.customer_email] || month < customerFirstOrder[o.customer_email]) {
                customerFirstOrder[o.customer_email] = month;
              }
            });

            // Build cohort data
            const cohortMonths = [...new Set(Object.values(customerFirstOrder))].sort().slice(-12);
            const cohortData = cohortMonths.map(cohortMonth => {
              const cohortCustomers = Object.entries(customerFirstOrder).filter(([_, m]) => m === cohortMonth).map(([email]) => email);
              const cohortSize = cohortCustomers.length;
              const retention: Record<number, number> = {};

              for (let offset = 0; offset <= 6; offset++) {
                const targetDate = new Date(cohortMonth + "-01");
                targetDate.setMonth(targetDate.getMonth() + offset);
                const targetMonth = targetDate.toISOString().slice(0, 7);
                const activeInMonth = new Set(
                  allO.filter((o: any) => (o.created_at || "").startsWith(targetMonth) && cohortCustomers.includes(o.customer_email)).map((o: any) => o.customer_email)
                );
                retention[offset] = activeInMonth.size;
              }

              return { month: cohortMonth, size: cohortSize, retention };
            });

            return (
              <ChartCard title="Monthly Cohort Retention" empty={cohortData.length === 0}>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="p-2 text-left">Cohort</th>
                        <th className="p-2 text-center">Size</th>
                        {[0,1,2,3,4,5,6].map(m => <th key={m} className="p-2 text-center">M{m}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {cohortData.map(row => (
                        <tr key={row.month} className="border-t border-border">
                          <td className="p-2 font-semibold">{row.month}</td>
                          <td className="p-2 text-center">{row.size}</td>
                          {[0,1,2,3,4,5,6].map(m => {
                            const val = row.retention[m] || 0;
                            const pctVal = row.size > 0 ? Math.round((val / row.size) * 100) : 0;
                            const opacity = Math.min(pctVal / 100, 1);
                            return (
                              <td key={m} className="p-2 text-center" style={{ backgroundColor: `rgba(45, 106, 79, ${opacity * 0.6})`, color: opacity > 0.3 ? "white" : undefined }}>
                                {pctVal}%
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

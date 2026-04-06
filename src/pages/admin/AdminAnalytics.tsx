import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function AdminAnalytics() {
  const { data: events } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  const evts = events || [];
  const eventCounts: Record<string, number> = {};
  evts.forEach((e: any) => {
    eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
  });

  const chartData = Object.entries(eventCounts).map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Daily event counts
  const dailyCounts: Record<string, number> = {};
  evts.forEach((e: any) => {
    const day = e.created_at?.slice(0, 10);
    if (day) dailyCounts[day] = (dailyCounts[day] || 0) + 1;
  });
  const dailyData = Object.entries(dailyCounts).sort().slice(-14).map(([date, count]) => ({ date, count }));

  return (
    <div>
      <h1 className="pf text-2xl font-bold mb-6">Analytics</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-bold mb-4">Events by Type</h2>
          {chartData.length === 0 ? (
            <p className="text-text-med text-sm py-8 text-center">No events recorded yet. Events will appear as users interact with the site.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="type" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--forest))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-bold mb-4">Daily Activity (Last 14 Days)</h2>
          {dailyData.length === 0 ? (
            <p className="text-text-med text-sm py-8 text-center">No daily data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--coral))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <div className="mt-6 bg-card border border-border rounded-xl p-5">
        <h2 className="font-bold mb-4">Summary</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { label: "Quiz Started", key: "quiz_started" },
            { label: "Quiz Completed", key: "quiz_completed" },
            { label: "Products Added", key: "product_added" },
            { label: "Shares", key: "share_clicked" },
            { label: "Calculator Uses", key: "calculator_used" },
            { label: "Checkouts", key: "checkout_started" },
          ].map(item => (
            <div key={item.key} className="text-center">
              <div className="text-2xl font-bold pf">{eventCounts[item.key] || 0}</div>
              <div className="text-text-light text-[10px]">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
